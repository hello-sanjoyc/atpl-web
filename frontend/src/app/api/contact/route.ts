import net from "node:net";
import tls from "node:tls";

import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ContactPayload = {
    fname?: string;
    lname?: string;
    email?: string;
    project?: string;
    message?: string;
};

type MailMessage = {
    from: string;
    fromName: string;
    to: string;
    replyTo: string;
    subject: string;
    text: string;
};

type SmtpResponse = {
    code: number;
    message: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizeHeader(value: string) {
    return value.replace(/[\r\n]+/g, " ").trim();
}

function formatAddress(email: string, name?: string) {
    const safeEmail = sanitizeHeader(email);
    const safeName = name ? sanitizeHeader(name) : "";

    return safeName ? `"${safeName.replaceAll('"', "'")}" <${safeEmail}>` : safeEmail;
}

function escapeData(value: string) {
    return value
        .replace(/\r?\n/g, "\r\n")
        .replace(/^\./gm, "..");
}

function validatePayload(payload: ContactPayload) {
    const values = {
        fname: payload.fname?.trim() ?? "",
        lname: payload.lname?.trim() ?? "",
        email: payload.email?.trim() ?? "",
        project: payload.project?.trim() ?? "",
        message: payload.message?.trim() ?? "",
    };

    if (!values.fname) return { error: "First name is required." };
    if (!values.lname) return { error: "Last name is required." };
    if (!values.email) return { error: "Email is required." };
    if (!emailPattern.test(values.email)) {
        return { error: "Enter a valid email address." };
    }
    if (!values.project) return { error: "Project is required." };
    if (!values.message) return { error: "Message is required." };

    return { values };
}

function getSmtpConfig() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.MAIL_FROM_EMAIL;
    const to = process.env.MAIL_TO;
    const port = Number.parseInt(process.env.SMTP_PORT ?? "587", 10);
    const secure =
        process.env.SMTP_SECURE === "true" ||
        Number.parseInt(process.env.SMTP_PORT ?? "", 10) === 465;

    if (!host || !user || !pass || !from || !to || !Number.isFinite(port)) {
        throw new Error("SMTP configuration is incomplete.");
    }

    return {
        host,
        port,
        secure,
        user,
        pass,
        from,
        fromName: process.env.MAIL_FROM_NAME ?? "Aranax Technologies",
        to,
    };
}

class SmtpClient {
    private buffer = "";
    private socket: net.Socket | tls.TLSSocket | null = null;

    constructor(
        private readonly host: string,
        private readonly port: number,
        private readonly secure: boolean,
    ) {}

    async connect() {
        this.socket = await new Promise<net.Socket | tls.TLSSocket>(
            (resolve, reject) => {
                const socket = this.secure
                    ? tls.connect({
                          host: this.host,
                          port: this.port,
                          servername: this.host,
                      })
                    : net.connect({ host: this.host, port: this.port });

                const timer = setTimeout(() => {
                    socket.destroy();
                    reject(new Error("SMTP connection timed out."));
                }, 10000);

                socket.once(this.secure ? "secureConnect" : "connect", () => {
                    clearTimeout(timer);
                    resolve(socket);
                });
                socket.once("error", reject);
            },
        );

        this.socket.setEncoding("utf8");
        return this.readResponse();
    }

    async startTls() {
        if (!this.socket) throw new Error("SMTP socket is not connected.");

        this.socket = await new Promise<tls.TLSSocket>((resolve, reject) => {
            const socket = tls.connect({
                socket: this.socket as net.Socket,
                servername: this.host,
            });

            socket.once("secureConnect", () => {
                socket.setEncoding("utf8");
                resolve(socket);
            });
            socket.once("error", reject);
        });
    }

    async command(command: string) {
        if (!this.socket) throw new Error("SMTP socket is not connected.");
        this.socket.write(`${command}\r\n`);
        return this.readResponse();
    }

    close() {
        this.socket?.end();
    }

    private readResponse(): Promise<SmtpResponse> {
        if (!this.socket) throw new Error("SMTP socket is not connected.");

        return new Promise((resolve, reject) => {
            const socket = this.socket;
            if (!socket) return reject(new Error("SMTP socket is not connected."));

            const timer = setTimeout(() => {
                cleanup();
                reject(new Error("SMTP server did not respond."));
            }, 10000);

            const cleanup = () => {
                clearTimeout(timer);
                socket.off("data", onData);
                socket.off("error", onError);
            };

            const onError = (error: Error) => {
                cleanup();
                reject(error);
            };

            const onData = (chunk: string | Buffer) => {
                this.buffer += chunk.toString();
                const response = this.parseResponse();
                if (!response) return;

                cleanup();
                resolve(response);
            };

            const response = this.parseResponse();
            if (response) {
                cleanup();
                resolve(response);
                return;
            }

            socket.on("data", onData);
            socket.once("error", onError);
        });
    }

    private parseResponse() {
        const lines = this.buffer.split(/\r?\n/).filter(Boolean);
        if (lines.length === 0) return null;

        const lastLine = lines[lines.length - 1];
        const match = lastLine.match(/^(\d{3})\s/);
        if (!match) return null;

        const message = lines.join("\n");
        this.buffer = "";

        return {
            code: Number.parseInt(match[1], 10),
            message,
        };
    }
}

function assertCode(response: SmtpResponse, expected: number | number[]) {
    const expectedCodes = Array.isArray(expected) ? expected : [expected];
    if (!expectedCodes.includes(response.code)) {
        throw new Error(`SMTP error ${response.code}: ${response.message}`);
    }
}

async function sendMail(mail: MailMessage) {
    const config = getSmtpConfig();
    const client = new SmtpClient(config.host, config.port, config.secure);

    try {
        assertCode(await client.connect(), 220);

        const ehlo = await client.command("EHLO aranax.tech");
        assertCode(ehlo, 250);

        if (!config.secure && ehlo.message.includes("STARTTLS")) {
            assertCode(await client.command("STARTTLS"), 220);
            await client.startTls();
            assertCode(await client.command("EHLO aranax.tech"), 250);
        }

        assertCode(await client.command("AUTH LOGIN"), 334);
        assertCode(
            await client.command(Buffer.from(config.user).toString("base64")),
            334,
        );
        assertCode(
            await client.command(Buffer.from(config.pass).toString("base64")),
            235,
        );

        assertCode(await client.command(`MAIL FROM:<${config.from}>`), 250);
        assertCode(await client.command(`RCPT TO:<${config.to}>`), [250, 251]);
        assertCode(await client.command("DATA"), 354);

        const body = [
            `From: ${formatAddress(mail.from, mail.fromName)}`,
            `To: ${formatAddress(mail.to)}`,
            `Reply-To: ${formatAddress(mail.replyTo)}`,
            `Subject: ${sanitizeHeader(mail.subject)}`,
            "Content-Type: text/plain; charset=utf-8",
            "",
            escapeData(mail.text),
            ".",
        ].join("\r\n");

        assertCode(await client.command(body), 250);
        await client.command("QUIT");
    } finally {
        client.close();
    }
}

export async function POST(request: Request) {
    let payload: ContactPayload;

    try {
        payload = await request.json();
    } catch {
        return NextResponse.json(
            { message: "Invalid request payload." },
            { status: 400 },
        );
    }

    const validation = validatePayload(payload);
    if ("error" in validation) {
        return NextResponse.json({ message: validation.error }, { status: 400 });
    }

    try {
        const { values } = validation;
        const config = getSmtpConfig();
        const fullName = `${values.fname} ${values.lname}`.trim();

        await sendMail({
            from: config.from,
            fromName: config.fromName,
            to: config.to,
            replyTo: values.email,
            subject: `New project enquiry from ${fullName}`,
            text: [
                "New enquiry from the Aranax website.",
                "",
                `Name: ${fullName}`,
                `Email: ${values.email}`,
                `Project: ${values.project}`,
                "",
                "Message:",
                values.message,
            ].join("\n"),
        });

        return NextResponse.json({
            message: "Thanks. Your message has been sent successfully.",
        });
    } catch (error) {
        console.error("Contact form email failed:", error);
        return NextResponse.json(
            { message: "We could not send your message. Please try again." },
            { status: 500 },
        );
    }
}

export default {
  routes: [
    {
      method: 'POST',
      path: '/contact',
      handler: 'contact-submission.submit',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};

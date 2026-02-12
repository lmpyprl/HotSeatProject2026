/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./views/**/*.hbs", "./public/js/**/*.js"],
  theme: {
  extend: {
    gridTemplateColumns: {
      17: "repeat(17, minmax(0, 1fr))",
    },
  },
},

  plugins: [require("daisyui")],
  daisyui: {
    themes: ["dark", "cupcake"],
  },
};

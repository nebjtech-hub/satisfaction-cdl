/** Charte issue du logo Centre Diagnostic */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cdl: {
          teal: '#41B8AC',      // cœur (turquoise du logo)
          tealfonce: '#25766D', // turquoise assombri : boutons et textes (contraste AA)
          ciel: '#5AC2EC',      // silhouette (bleu ciel du logo)
          cielfonce: '#1F7FA8',
          gris: '#89898C',      // typo « Centre Diagnostic »
          encre: '#33424F',     // texte courant
          brume: '#F1F8FA',     // fond
          ligne: '#D9E6EB',
          alerte: '#B4472F',
        },
      },
      fontFamily: { sans: ['Figtree', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'] },
    },
  },
  plugins: [],
}

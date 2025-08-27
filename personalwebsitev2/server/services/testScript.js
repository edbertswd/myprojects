const PokemonService = require('./pokemonService');

async function run() {
  try {
    // Felt Hat Pikachu (Scarlet & Violet Promo #85)
    const feltHatResults = await PokemonService.searchCards(
      'name:"Pikachu" set.id:svp'
    );
    console.log('Felt Hat Pikachu search:', 
      feltHatResults.cards.map(c => ({ name: c.name, id: c.id, number: c.number, set: c.set?.id }))
    );
  } catch (err) {
    console.error('❌ Error running test:', err.message);
  }
}

run();

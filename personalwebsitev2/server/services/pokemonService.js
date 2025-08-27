const axios = require('axios');

class PokemonService {
  constructor() {
    this.baseURL = 'https://api.pokemontcg.io/v2';
    this.apiKey = process.env.POKEMON_TCG_API_KEY;
    
    // Default headers
    this.headers = {
      'Content-Type': 'application/json',
      'X-Api-Key': this.apiKey,
    };
    

    // Card collection 
    this.myCollection = [
      { id: 'svp-85', quantity: 1 },        // Pikachu with Grey Felt Hat
      { id: 'det1-10', quantity: 1 },       // Detective Pikachu (English set, #10/18)
    ];
  }

  // Update my collection
  updateCollection(collection) {
    this.myCollection = collection;
  }

  // Get multiple cards by their IDs
  async getCardsByIds(cardIds) {
    try {
      const promises = cardIds.map(async (cardData) => {
        const cardId = typeof cardData === 'string' ? cardData : cardData.id;
        const quantity = typeof cardData === 'object' ? cardData.quantity : 1;
        
        try {
          console.log(`🔍 Fetching card: ${cardId}`);
          const response = await axios.get(`${this.baseURL}/cards/${cardId}`, {
            headers: this.headers
          });
          
          console.log(`✅ Found card: ${response.data.data.name}`);
          return {
            ...response.data.data,
            quantity: quantity
          };
        } catch (cardError) {
          console.error(`❌ Card not found: ${cardId} (${cardError.response?.status})`);
          return null; // Return null for missing cards instead of throwing
        }
      });

      const cards = await Promise.all(promises);
      const validCards = cards.filter(card => card !== null);
      console.log(`📋 Successfully fetched ${validCards.length}/${cardIds.length} cards`);
      
      return validCards;
    } catch (error) {
      console.error('Error fetching cards by IDs:', error.message);
      throw error;
    }
  }

  // Get my collection cards
  async getMyCollection() {
    try {
      return await this.getCardsByIds(this.myCollection);
    } catch (error) {
      console.error('Error getting my collection:', error.message);
      throw error;
    }
  }

  // Get featured cards
  async getFeaturedCards(limit = 6) {
    try {
      const collection = await this.getMyCollection();

      // Expanded rarity + subtype lists
      const FEATURED_RARITIES = [
        'Promo', 'Rare', 'Rare Holo', 'Holo Rare', 'Ultra Rare',
        'Secret Rare', 'Rainbow Rare', 'Illustration Rare',
        'Special Illustration Rare', 'Hyper Rare', 'Double Rare',
        'Shiny Rare', 'Amazing Rare', 'Trainer Gallery'
      ];

      const FEATURED_SUBTYPES = [
        'ex', 'EX', 'gx', 'GX', 'v', 'VMAX', 'VSTAR',
        'ACE SPEC', 'Radiant'
      ];

      // Filter
      const featured = collection
        .filter(card => {
          const rarity = card.rarity || '';
          const subtypes = (card.subtypes || []).map(s => String(s));
          const isRare = FEATURED_RARITIES.includes(rarity);
          const isSpecial = subtypes.some(s =>
            FEATURED_SUBTYPES.includes(s)
          );
          return isRare || isSpecial;
        })
        .sort((a, b) => {
          // Sort by TCGPlayer market price if available
          const price = c =>
            c.tcgplayer?.prices?.holofoil?.market ??
            c.tcgplayer?.prices?.reverseHolofoil?.market ??
            c.tcgplayer?.prices?.normal?.market ??
            c.tcgplayer?.prices?.firstEditionHolofoil?.market ??
            0;
          return price(b) - price(a);
        })
        .slice(0, limit);

      // fallback: just return the first N from collection if nothing matched
      return featured.length > 0 ? featured : collection.slice(0, limit);
    } catch (error) {
      console.error('Error getting featured cards:', error.message);
      throw error;
    }
  }

  // Get random cards from collection
  async getRandomCards(count = 3) {
    try {
      const collection = await this.getMyCollection();
      const shuffled = collection.sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
    } catch (error) {
      console.error('Error getting random cards:', error.message);
      throw error;
    }
  }

  // Get collection stats
  async getCollectionStats() {
    try {
      const collection = await this.getMyCollection();
      
      const stats = {
        totalCards: collection.reduce((sum, card) => sum + (card.quantity || 1), 0),
        uniqueCards: collection.length,
        totalValue: 0,
        rarityBreakdown: {},
        typeBreakdown: {},
        setBreakdown: {}
      };

      collection.forEach(card => {
        // Calculate total value
        const cardValue = card.tcgplayer?.prices?.holofoil?.market || 
                         card.tcgplayer?.prices?.normal?.market || 0;
        stats.totalValue += cardValue * (card.quantity || 1);

        // Rarity breakdown
        const rarity = card.rarity || 'Unknown';
        stats.rarityBreakdown[rarity] = (stats.rarityBreakdown[rarity] || 0) + (card.quantity || 1);

        // Type breakdown
        if (card.types) {
          card.types.forEach(type => {
            stats.typeBreakdown[type] = (stats.typeBreakdown[type] || 0) + (card.quantity || 1);
          });
        }

        // Set breakdown
        const setName = card.set?.name || 'Unknown';
        stats.setBreakdown[setName] = (stats.setBreakdown[setName] || 0) + (card.quantity || 1);
      });

      return stats;
    } catch (error) {
      console.error('Error getting collection stats:', error.message);
      throw error;
    }
  }

  // Search for cards (for adding to collection)
  async searchCards(query, options = {}) {
    try {
      const params = {
        q: query,
        page: options.page || 1,
        pageSize: options.pageSize || 20,
        ...options.filters
      };

      console.log('🔍 Searching cards with params:', params);
      console.log('🌐 API URL:', `${this.baseURL}/cards`);
      console.log('📋 Headers:', this.headers);

      // Let's also log the full URL that will be called
      const url = new URL(`${this.baseURL}/cards`);
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
      console.log('🔗 Full URL:', url.toString());

      const response = await axios.get(`${this.baseURL}/cards`, {
        headers: this.headers,
        params: params,
        timeout: 20000 // 20 second timeout
      });

      console.log('✅ Search successful, found:', response.data.totalCount, 'cards');

      return {
        cards: response.data.data,
        totalCount: response.data.totalCount,
        page: response.data.page,
        pageSize: response.data.pageSize,
        totalPages: Math.ceil(response.data.totalCount / response.data.pageSize)
      };
    } catch (error) {
      console.error('❌ Error searching cards:', error.message);
      
      if (error.code === 'ECONNABORTED') {
        console.error('⏰ Request timed out - server may have network issues');
        return {
          cards: [],
          totalCount: 0,
          page: 1,
          pageSize: 20,
          totalPages: 0,
          error: 'API timeout - please try again later'
        };
      }
      
      if (error.response) {
        console.error('📊 Response status:', error.response.status);
        console.error('📝 Response data:', error.response.data);
      }
      
      // Return empty result instead of throwing
      return {
        cards: [],
        totalCount: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
        error: error.message
      };
    }
  }

  // Get card sets (for browsing)
  async getSets(options = {}) {
    try {
      const params = {
        page: options.page || 1,
        pageSize: options.pageSize || 50
      };

      const response = await axios.get(`${this.baseURL}/sets`, {
        headers: this.headers,
        params: params
      });

      return response.data;
    } catch (error) {
      console.error('Error getting sets:', error.message);
      throw error;
    }
  }
}

module.exports = new PokemonService();
const express = require('express');
const router = express.Router();
const pokemonService = require('../services/pokemonService');

// Get your full card collection
router.get('/collection', async (req, res) => {
  try {
    const cacheKey = 'pokemon_collection';
    const cached = req.cache.get(cacheKey);
    
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    const collection = await pokemonService.getMyCollection();
    
    // Cache for 1 hour (collection doesn't change often)
    req.cache.set(cacheKey, { cards: collection }, 3600);
    
    res.json({ cards: collection, cached: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get featured cards (rare/valuable cards for display)
router.get('/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const cacheKey = `pokemon_featured_${limit}`;
    const cached = req.cache.get(cacheKey);
    
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    const featured = await pokemonService.getFeaturedCards(limit);
    
    // Cache for 30 minutes
    req.cache.set(cacheKey, { cards: featured }, 1800);
    
    res.json({ cards: featured, cached: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get random cards from collection
router.get('/random', async (req, res) => {
  try {
    const count = parseInt(req.query.count) || 3;
    const random = await pokemonService.getRandomCards(count);
    
    res.json({ cards: random });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get collection statistics
router.get('/stats', async (req, res) => {
  try {
    const cacheKey = 'pokemon_stats';
    const cached = req.cache.get(cacheKey);
    
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    const stats = await pokemonService.getCollectionStats();
    
    // Cache for 2 hours
    req.cache.set(cacheKey, stats, 7200);
    
    res.json({ ...stats, cached: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search for cards (for managing collection)
router.get('/search', async (req, res) => {
  try {
    const { q, page, pageSize, ...filters } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const options = {
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 20,
      filters
    };

    const results = await pokemonService.searchCards(q, options);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get available card sets
router.get('/sets', async (req, res) => {
  try {
    const { page, pageSize } = req.query;
    const cacheKey = `pokemon_sets_${page || 1}`;
    const cached = req.cache.get(cacheKey);
    
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    const options = {
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 50
    };

    const sets = await pokemonService.getSets(options);
    
    // Cache for 24 hours (sets don't change often)
    req.cache.set(cacheKey, sets, 86400);
    
    res.json({ ...sets, cached: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update collection (POST endpoint for managing your cards)
router.post('/collection/update', async (req, res) => {
  try {
    const { collection } = req.body;
    
    if (!Array.isArray(collection)) {
      return res.status(400).json({ error: 'Collection must be an array of card objects' });
    }

    pokemonService.updateCollection(collection);
    
    // Clear cache when collection is updated
    req.cache.flushAll();
    
    res.json({ 
      message: 'Collection updated successfully',
      totalCards: collection.length 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single card by ID
router.get('/card/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `pokemon_card_${id}`;
    const cached = req.cache.get(cacheKey);
    
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    const cards = await pokemonService.getCardsByIds([id]);
    const card = cards[0];
    
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    // Cache individual cards for 24 hours
    req.cache.set(cacheKey, card, 86400);
    
    res.json({ ...card, cached: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
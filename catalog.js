'use strict';

// ---------------------------------------------------------------------------
// JSON-LD @context URLs for the three transaction-layer schemas
// ---------------------------------------------------------------------------
const COMMITMENT_CTX   = 'https://schema.beckn.io/RetailCommitment/v2.1/context.jsonld';
const CONSIDERATION_CTX = 'https://schema.beckn.io/RetailConsideration/v2.1/context.jsonld';
const PERFORMANCE_CTX   = 'https://schema.beckn.io/RetailPerformance/v2.1/context.jsonld';

// ---------------------------------------------------------------------------
// In-memory catalog – Sarpino's Pizzeria (Mumbai, Bandra)
// resourceAttributes use FoodAndBeverageResourceAttributes (v2.1)
// ---------------------------------------------------------------------------
const resources = {
  'resource:sarpinos:margherita:001': {
    id:        'resource:sarpinos:margherita:001',
    name:      'Margherita Pizza',
    offerId:   'offer:sarpinos:margherita:001',
    unitPrice: 289,
    currency:  'INR',
    unitCode:  'EA',
    resourceAttributes: {
      '@context': 'https://schema.beckn.io/FoodAndBeverageResource/v2.1/context.jsonld',
      '@type':    'fnbr:FoodAndBeverageResourceAttributes',
      identity: { brand: "Sarpino's Pizzeria", originCountry: 'IN' },
      physical: { weight: { unitQuantity: 350, unitCode: 'GRAM' } },
      food:     { classification: 'VEG' },
      allergens:  ['GLUTEN', 'DAIRY'],
      cuisine:    'Italian',
      preparation: {
        instructions: 'Freshly baked thin-crust pizza with tomato sauce, fresh mozzarella, and basil. Wood-fired at 300 °C.',
        storage:      'Serve immediately while hot',
        shelfLife:    'PT30M'
      }
    }
  },

  'resource:sarpinos:pepperoni:001': {
    id:        'resource:sarpinos:pepperoni:001',
    name:      'Pepperoni Feast Pizza',
    offerId:   'offer:sarpinos:pepperoni:001',
    unitPrice: 389,
    currency:  'INR',
    unitCode:  'EA',
    resourceAttributes: {
      '@context': 'https://schema.beckn.io/FoodAndBeverageResource/v2.1/context.jsonld',
      '@type':    'fnbr:FoodAndBeverageResourceAttributes',
      identity: { brand: "Sarpino's Pizzeria", originCountry: 'IN' },
      physical: { weight: { unitQuantity: 420, unitCode: 'GRAM' } },
      food:     { classification: 'NON_VEG' },
      allergens:  ['GLUTEN', 'DAIRY'],
      cuisine:    'Italian',
      preparation: {
        instructions: 'Hand-tossed crust loaded with premium pepperoni, mozzarella, and zesty tomato sauce.',
        storage:      'Serve immediately',
        shelfLife:    'PT30M'
      }
    }
  },

  'resource:sarpinos:garlic-bread:001': {
    id:        'resource:sarpinos:garlic-bread:001',
    name:      'Garlic Bread with Cheese',
    offerId:   'offer:sarpinos:garlic-bread:001',
    unitPrice: 149,
    currency:  'INR',
    unitCode:  'EA',
    resourceAttributes: {
      '@context': 'https://schema.beckn.io/FoodAndBeverageResource/v2.1/context.jsonld',
      '@type':    'fnbr:FoodAndBeverageResourceAttributes',
      identity: { brand: "Sarpino's Pizzeria", originCountry: 'IN' },
      physical: { weight: { unitQuantity: 200, unitCode: 'GRAM' } },
      food:     { classification: 'VEG' },
      allergens:  ['GLUTEN', 'DAIRY'],
      cuisine:    'Italian',
      preparation: {
        instructions: 'Toasted baguette slices with herb-garlic butter and melted mozzarella.',
        storage:      'Best served hot',
        shelfLife:    'PT20M'
      }
    }
  },

  'resource:sarpinos:tiramisu:001': {
    id:        'resource:sarpinos:tiramisu:001',
    name:      'Classic Tiramisu',
    offerId:   'offer:sarpinos:tiramisu:001',
    unitPrice: 199,
    currency:  'INR',
    unitCode:  'EA',
    resourceAttributes: {
      '@context': 'https://schema.beckn.io/FoodAndBeverageResource/v2.1/context.jsonld',
      '@type':    'fnbr:FoodAndBeverageResourceAttributes',
      identity: { brand: "Sarpino's Pizzeria", originCountry: 'IN' },
      physical: { weight: { unitQuantity: 150, unitCode: 'GRAM' } },
      food:     { classification: 'VEG' },
      allergens:  ['DAIRY', 'EGGS', 'GLUTEN'],
      cuisine:    'Italian',
      preparation: {
        instructions: 'Espresso-soaked ladyfingers layered with mascarpone cream and dusted with cocoa.',
        storage:      'Keep chilled; consume within 24 hours of delivery',
        shelfLife:    'PT24H'
      }
    }
  }
};

// Provider / catalog metadata
const provider = {
  id: 'provider:sarpinos:bandra:001',
  name:      "Sarpino's Pizzeria — Bandra",
  shortDesc: 'Authentic Italian cuisine, Mumbai',
  city:      'ONDC:std:city:Mumbai'
};

module.exports = { resources, provider, COMMITMENT_CTX, CONSIDERATION_CTX, PERFORMANCE_CTX };

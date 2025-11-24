import { Capacitor } from '@capacitor/core';

// Product interfaces
export interface Product {
  productId: string;
  price: string;
  priceAmount: number;
  currency: string;
  title: string;
  description: string;
  type: 'inapp' | 'subs';
}

export interface Purchase {
  productId: string;
  purchaseToken: string;
  orderId: string;
  purchaseTime: number;
  expiryTime?: number;
  purchaseState: 'purchased' | 'pending' | 'cancelled';
  acknowledged: boolean;
  signature?: string;
  receipt?: string;
}

/**
 * Client-Side Purchase Verification Service
 * WARNING: This is not fully secure - use only for testing or low-value items
 */
class ClientSideVerification {
  private readonly STORAGE_KEY = 'verified_purchases_v1';
  private readonly SECRET_KEY = 'sk_' + btoa('capacitor_billing_2024');

  /**
   * Verify purchase client-side
   */
  async verifyPurchase(transaction: any): Promise<boolean> {
    try {
      console.log('Client-side verification for:', transaction.productId);

      if (!transaction || !transaction.purchaseToken) {
        console.error('Missing purchase token');
        return false;
      }

      // Check purchase time validity (not older than 2 years)
      const purchaseTime = transaction.purchaseTime || Date.now();
      const twoYearsAgo = Date.now() - (2 * 365 * 24 * 60 * 60 * 1000);
      
      if (purchaseTime < twoYearsAgo) {
        console.warn('Purchase is older than 2 years');
        return false;
      }

      // For subscriptions, check expiry time
      if (transaction.expiryTime) {
        const now = Date.now();
        if (transaction.expiryTime < now) {
          console.log('Subscription expired');
          return false;
        }
      }

      // Check purchase state
      if (transaction.purchaseState && 
          transaction.purchaseState !== 'purchased' && 
          transaction.purchaseState !== 1) {
        console.error('Invalid purchase state:', transaction.purchaseState);
        return false;
      }

      // Verify receipt signature if available
      if (transaction.receipt && transaction.signature) {
        const isValid = this.verifyReceiptSignature(
          transaction.receipt,
          transaction.signature
        );
        if (!isValid) {
          console.error('Invalid receipt signature');
          return false;
        }
      }

      console.log('Purchase verified successfully');
      return true;

    } catch (error) {
      console.error('Verification failed:', error);
      return false;
    }
  }

  /**
   * Verify receipt signature
   */
  private verifyReceiptSignature(receipt: string, signature: string): boolean {
    try {
      // Basic signature validation
      return signature && signature.length > 20;
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  /**
   * Store verified purchase
   */
  storePurchase(purchase: Purchase): void {
    try {
      const purchases = this.getStoredPurchases();
      
      // Remove existing purchase with same token
      const filtered = purchases.filter(
        p => p.purchaseToken !== purchase.purchaseToken
      );

      // Add new purchase with verification timestamp
      filtered.push({
        ...purchase,
        verifiedAt: Date.now()
      } as any);

      // Encrypt and store
      const encrypted = this.encrypt(JSON.stringify(filtered));
      localStorage.setItem(this.STORAGE_KEY, encrypted);

      console.log('Purchase stored successfully');
    } catch (error) {
      console.error('Failed to store purchase:', error);
    }
  }

  /**
   * Get all stored purchases
   */
  getStoredPurchases(): Purchase[] {
    try {
      const encrypted = localStorage.getItem(this.STORAGE_KEY);
      if (!encrypted) return [];

      const decrypted = this.decrypt(encrypted);
      const purchases = JSON.parse(decrypted);

      // Filter out expired purchases
      const now = Date.now();
      return purchases.filter((p: any) => {
        if (!p.expiryTime) return true;
        return p.expiryTime > now;
      });

    } catch (error) {
      console.error('Failed to retrieve purchases:', error);
      return [];
    }
  }

  /**
   * Check if user has active premium
   */
  hasActivePremium(): boolean {
    try {
      const purchases = this.getStoredPurchases();
      const now = Date.now();

      return purchases.some(p => {
        // Lifetime purchase
        if (p.productId === 'premium_lifetime') {
          return true;
        }

        // Active subscription
        if (p.productId.includes('monthly') || p.productId.includes('yearly')) {
          return !p.expiryTime || p.expiryTime > now;
        }

        return false;
      });

    } catch (error) {
      console.error('Premium check failed:', error);
      return false;
    }
  }

  /**
   * Get specific purchase by product ID
   */
  getPurchase(productId: string): Purchase | null {
    const purchases = this.getStoredPurchases();
    return purchases.find(p => p.productId === productId) || null;
  }

  /**
   * Clear all purchases
   */
  clearPurchases(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('All purchases cleared');
  }

  /**
   * Basic encryption (obfuscation)
   */
  private encrypt(text: string): string {
    try {
      const combined = text + '|' + this.SECRET_KEY;
      return btoa(unescape(encodeURIComponent(combined)));
    } catch (error) {
      return btoa(text);
    }
  }

  /**
   * Basic decryption
   */
  private decrypt(encrypted: string): string {
    try {
      const decoded = decodeURIComponent(escape(atob(encrypted)));
      const parts = decoded.split('|' + this.SECRET_KEY);
      return parts[0];
    } catch (error) {
      return atob(encrypted);
    }
  }
}

const clientVerification = new ClientSideVerification();

/**
 * Google Play Billing Service - Real Implementation
 * Requires: cordova-plugin-purchase
 * Install: ionic capacitor plugin add cordova-plugin-purchase
 */
class GooglePlayBillingService {
  private isInitialized = false;
  private products: Product[] = [];
  private store: any = null;

  /**
   * Initialize billing service
   * MUST be called before any other operations
   */
  async initialize(): Promise<boolean> {
    try {
      // Validate platform
      if (!Capacitor.isNativePlatform()) {
        throw new Error('Billing is only available on native platforms');
      }

      if (Capacitor.getPlatform() !== 'android') {
        throw new Error('This implementation is for Android only');
      }

      // Check for plugin
      if (!(window as any).CdvPurchase) {
        throw new Error('cordova-plugin-purchase not installed. Install with: ionic capacitor plugin add cordova-plugin-purchase');
      }

      const { store, ProductType, Platform } = (window as any).CdvPurchase;
      this.store = store;

      // Register your products (update these IDs to match your Google Play Console)
      store.register([
        {
          id: 'premium_monthly',
          type: ProductType.PAID_SUBSCRIPTION,
          platform: Platform.GOOGLE_PLAY
        },
        {
          id: 'premium_lifetime',
          type: ProductType.NON_CONSUMABLE,
          platform: Platform.GOOGLE_PLAY
        }
      ]);

      // Setup event handlers
      this.setupEventHandlers();

      // Initialize the store
      await store.initialize([Platform.GOOGLE_PLAY]);

      // Wait for products to load
      await this.loadProducts();

      this.isInitialized = true;
      console.log('Google Play Billing initialized successfully');
      return true;

    } catch (error: any) {
      console.error('Billing initialization failed:', error);
      throw new Error(`Failed to initialize billing: ${error.message}`);
    }
  }

  /**
   * Setup purchase event handlers
   */
  private setupEventHandlers(): void {
    if (!this.store) return;

    // Handle approved purchases
    this.store.when().approved(async (transaction: any) => {
      console.log('Purchase approved:', transaction);
      
      try {
        // Client-side verification
        const isValid = await clientVerification.verifyPurchase(transaction);
        
        if (isValid) {
          // Extract product info
          const productId = transaction.products?.[0]?.id || transaction.sku;
          const product = this.store.get(productId);

          // Store the verified purchase
          const purchase: Purchase = {
            productId: productId,
            purchaseToken: transaction.purchaseToken || transaction.id,
            orderId: transaction.transactionId || transaction.orderId,
            purchaseTime: transaction.purchaseTime || Date.now(),
            expiryTime: transaction.expiryTime,
            purchaseState: 'purchased',
            acknowledged: true,
            signature: transaction.signature,
            receipt: transaction.receipt
          };

          clientVerification.storePurchase(purchase);
          
          // Finish the transaction
          transaction.finish();
          
          console.log('Purchase verified and stored:', purchase);
          
          // Trigger custom event for UI updates
          window.dispatchEvent(new CustomEvent('premiumActivated', { 
            detail: purchase 
          }));
        } else {
          console.error('Purchase verification failed');
          window.dispatchEvent(new CustomEvent('purchaseError', { 
            detail: { error: 'Verification failed' }
          }));
        }
      } catch (error) {
        console.error('Error processing purchase:', error);
        window.dispatchEvent(new CustomEvent('purchaseError', { 
          detail: { error: error.message }
        }));
      }
    });

    // Handle finished purchases
    this.store.when().finished((transaction: any) => {
      console.log('Purchase finished:', transaction);
    });

    // Handle errors
    this.store.error((error: any) => {
      console.error('Store error:', error);
      window.dispatchEvent(new CustomEvent('purchaseError', { 
        detail: error 
      }));
    });

    // Handle product updates
    this.store.when().productUpdated((product: any) => {
      console.log('Product updated:', product);
      this.updateProductList();
    });

    
  }

  /**
   * Load products from Google Play Store
   */
  private async loadProducts(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.store) {
        reject(new Error('Store not initialized'));
        return;
      }

      let attempts = 0;
      const maxAttempts = 20; // 10 seconds max

      const checkProducts = () => {
        const storeProducts = this.store.products;
        
        if (storeProducts && storeProducts.length > 0) {
          this.updateProductList();
          console.log('Loaded products from Google Play:', this.products);
          resolve();
        } else {
          attempts++;
          if (attempts >= maxAttempts) {
            reject(new Error('Failed to load products from Google Play. Check your product IDs in Google Play Console.'));
          } else {
            setTimeout(checkProducts, 500);
          }
        }
      };

      checkProducts();
    });
  }

  /**
   * Update internal product list from store
   */
  private updateProductList(): void {
    if (!this.store) return;

    const storeProducts = this.store.products;
    this.products = storeProducts.map((p: any) => ({
      productId: p.id,
      price: p.pricing?.price || 'N/A',
      priceAmount: p.pricing?.priceMicros ? p.pricing.priceMicros / 1000000 : 0,
      currency: p.pricing?.currency || 'USD',
      title: p.title || p.id,
      description: p.description || '',
      type: p.type.includes('subscription') ? 'subs' : 'inapp'
    }));
  }

  /**
   * Get available products
   */
  async getProducts(): Promise<Product[]> {
    if (!this.isInitialized) {
      throw new Error('Billing not initialized. Call initialize() first.');
    }
    return this.products;
  }

  /**
   * Get specific product
   */
  async getProduct(productId: string): Promise<Product | null> {
    const products = await this.getProducts();
    return products.find(p => p.productId === productId) || null;
  }

  /**
   * Purchase a product
   */
  async purchaseProduct(productId: string): Promise<{ 
    success: boolean; 
    purchase?: Purchase; 
    error?: string 
  }> {
    try {
      if (!this.isInitialized) {
        throw new Error('Billing not initialized. Call initialize() first.');
      }

      if (!this.store) {
        throw new Error('Store not available');
      }

      const product = this.store.get(productId);
      
      if (!product) {
        return { 
          success: false, 
          error: `Product '${productId}' not found. Check your Google Play Console product IDs.` 
        };
      }

      if (!product.canPurchase) {
        return { 
          success: false, 
          error: 'Product cannot be purchased at this time' 
        };
      }

      const offer = product.getOffer();
      if (!offer) {
        return { 
          success: false, 
          error: 'No valid offer found for this product' 
        };
      }

      console.log('Starting purchase flow for:', productId);

      // Start purchase flow - this will trigger Google Play billing UI
      const result = await offer.order();

      // The actual purchase completion is handled by event listeners
      // Return success status immediately
      return {
        success: true,
        purchase: {
          productId: productId,
          purchaseToken: 'pending',
          orderId: 'pending',
          purchaseTime: Date.now(),
          purchaseState: 'pending',
          acknowledged: false
        }
      };

    } catch (error: any) {
      console.error('Purchase error:', error);
      return { 
        success: false, 
        error: error.message || 'Purchase failed' 
      };
    }
  }

  /**
   * Query existing purchases from Google Play
   */
  async queryPurchases(): Promise<Purchase[]> {
    try {
      if (!this.isInitialized || !this.store) {
        throw new Error('Billing not initialized');
      }

      const purchases: Purchase[] = [];
      
      // Get all owned products from the store
      this.store.products.forEach((product: any) => {
        if (product.owned) {
          const transaction = product.transaction;
          if (transaction) {
            const purchase: Purchase = {
              productId: product.id,
              purchaseToken: transaction.purchaseToken || transaction.id,
              orderId: transaction.transactionId || transaction.id,
              purchaseTime: transaction.purchaseTime || Date.now(),
              expiryTime: transaction.expiryTime,
              purchaseState: 'purchased',
              acknowledged: true,
              signature: transaction.signature,
              receipt: transaction.receipt
            };
            purchases.push(purchase);
          }
        }
      });

      // Also get stored purchases for backup
      const storedPurchases = clientVerification.getStoredPurchases();

      // Merge purchases
      return this.mergePurchases(storedPurchases, purchases);

    } catch (error) {
      console.error('Failed to query purchases:', error);
      // Fallback to stored purchases
      return clientVerification.getStoredPurchases();
    }
  }

  /**
   * Merge purchases from different sources
   */
  private mergePurchases(stored: Purchase[], store: Purchase[]): Purchase[] {
    const merged = [...stored];
    
    store.forEach(sp => {
      const exists = merged.find(p => 
        p.purchaseToken === sp.purchaseToken || 
        p.orderId === sp.orderId
      );
      
      if (!exists) {
        merged.push(sp);
      }
    });

    return merged;
  }

  /**
   * Restore purchases
   */
  async restorePurchases(): Promise<Purchase[]> {
    try {
      if (!this.store) {
        throw new Error('Store not available');
      }

      console.log('Restoring purchases...');
      await this.store.restorePurchases();
      
      // Query after restore
      const purchases = await this.queryPurchases();
      
      // Store all restored purchases
      purchases.forEach(purchase => {
        clientVerification.storePurchase(purchase);
      });

      console.log('Restored purchases:', purchases);
      return purchases;

    } catch (error) {
      console.error('Failed to restore purchases:', error);
      throw new Error('Failed to restore purchases');
    }
  }

  /**
   * Check if user has active premium
   */
  async hasActivePremium(): Promise<boolean> {
    try {
      // Check both store and storage
      const purchases = await this.queryPurchases();
      const now = Date.now();

      return purchases.some(p => {
        // Lifetime purchase
        if (p.productId === 'premium_lifetime') {
          return p.purchaseState === 'purchased';
        }

        // Active subscription
        if (p.productId.includes('monthly') || p.productId.includes('yearly')) {
          if (!p.expiryTime) return true;
          return p.expiryTime > now && p.purchaseState === 'purchased';
        }

        return false;
      });

    } catch (error) {
      console.error('Premium check failed:', error);
      // Fallback to stored verification
      return clientVerification.hasActivePremium();
    }
  }

  /**
   * Get specific purchase
   */
  async getPurchase(productId: string): Promise<Purchase | null> {
    const purchases = await this.queryPurchases();
    return purchases.find(p => p.productId === productId) || null;
  }

  /**
   * Clear all stored purchases (for testing only)
   */
  clearAllPurchases(): void {
    if (!__DEV__) {
      console.warn('clearAllPurchases should only be used in development');
      return;
    }
    clientVerification.clearPurchases();
  }

  /**
   * End billing connection
   */
  async endConnection(): Promise<void> {
    try {
      if (this.store) {
        this.store = null;
      }
      this.isInitialized = false;
      console.log('Billing connection ended');
    } catch (error) {
      console.error('Failed to end connection:', error);
    }
  }
}

// Export singleton
export const googlePlayBilling = new GooglePlayBillingService();

/**
 * SETUP INSTRUCTIONS:
 * 
 * 1. Install the plugin:
 *    ionic capacitor plugin add cordova-plugin-purchase
 * 
 * 2. Google Play Console Setup:
 *    - Go to Google Play Console > Your App > Monetization > Products
 *    - Create products with IDs: 'premium_monthly', 'premium_lifetime'
 *    - Set pricing and details
 *    - Activate products
 * 
 * 3. Configure testing:
 *    - Add license testing accounts in Google Play Console
 *    - Use test accounts to test purchases
 * 
 * 4. Update product IDs in this file:
 *    - Change 'premium_monthly' and 'premium_lifetime' to match your product IDs
 * 
 * USAGE:
 * 
 * // Initialize (call once when app starts)
 * try {
 *   await googlePlayBilling.initialize();
 * } catch (error) {
 *   console.error('Billing not available:', error);
 * }
 * 
 * // Get products
 * const products = await googlePlayBilling.getProducts();
 * 
 * // Purchase
 * const result = await googlePlayBilling.purchaseProduct('premium_monthly');
 * if (result.success) {
 *   console.log('Purchase initiated');
 * }
 * 
 * // Listen for purchase completion
 * window.addEventListener('premiumActivated', (e: any) => {
 *   console.log('Premium activated!', e.detail);
 *   // Update UI, unlock features, etc.
 * });
 * 
 * // Check premium status
 * const isPremium = await googlePlayBilling.hasActivePremium();
 * 
 * // Restore purchases
 * await googlePlayBilling.restorePurchases();
 */

declare const __DEV__: boolean;
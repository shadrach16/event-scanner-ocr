import { toast } from 'sonner';

export interface PaymentRequest {
  amount: string;
  currencyCode: string;
  plan: 'monthly' | 'lifetime';
  productId: string;
}

export class PaymentService {
  /**
   * Check if running on native platform
   */
  static isNative(): boolean {
    try {
      // Check if we're in a Capacitor environment
      return typeof window !== 'undefined' && 
             window.Capacitor && 
             window.Capacitor.isNativePlatform && 
             window.Capacitor.isNativePlatform();
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if Google Pay is available
   */
  static async isGooglePayAvailable(): Promise<boolean> {
    try {
      // For native platforms, check if Google Pay plugin is available
      if (this.isNative()) {
        // In a real app, this would check the actual Google Pay plugin
        return true; // Assume available for demo
      }
      
      // Web fallback - check if Payment Request API is available
      return 'PaymentRequest' in window;
    } catch (error) {
      console.error('Google Pay availability check failed:', error);
      return false;
    }
  }

  /**
   * Process payment with Google Pay
   */
  static async processGooglePayPayment(request: PaymentRequest): Promise<boolean> {
    try {
      if (this.isNative()) {
        return this.processNativePayment(request);
      } else {
        return this.processWebPayment(request);
      }
    } catch (error) {
      console.error('Payment processing failed:', error);
      toast.error('Payment failed. Please try again.');
      return false;
    }
  }

  /**
   * Process native payment
   */
  private static async processNativePayment(request: PaymentRequest): Promise<boolean> {
    try {
      toast.info('Processing native payment...');
      
      // Simulate native Google Pay processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate successful payment (90% success rate for demo)
      const success = Math.random() > 0.1;
      
      if (success) {
        // Store purchase information locally
        localStorage.setItem('premium-purchase', JSON.stringify({
          plan: request.plan,
          amount: request.amount,
          purchaseDate: new Date().toISOString(),
          productId: request.productId,
          paymentMethod: 'Google Pay Native'
        }));
        
        toast.success('🎉 Payment successful! Premium features activated.');
        return true;
      } else {
        toast.error('Payment processing failed. Please try again.');
        return false;
      }
    } catch (error) {
      console.error('Native payment failed:', error);
      toast.error('Payment failed. Please try again.');
      return false;
    }
  }

  /**
   * Process web payment using Payment Request API
   */
  private static async processWebPayment(request: PaymentRequest): Promise<boolean> {
    try {
      if (!('PaymentRequest' in window)) {
        // Final fallback - simulate payment for demo
        return this.simulatePayment(request);
      }

      const supportedInstruments = [{
        supportedMethods: 'https://google.com/pay',
        data: {
          environment: 'TEST', // Change to 'PRODUCTION' for live
          apiVersion: 2,
          apiVersionMinor: 0,
          merchantInfo: {
            merchantName: 'Photo2Calendar',
            merchantId: 'BCR2DN4T2CHVXNF6'
          },
          allowedPaymentMethods: [{
            type: 'CARD',
            parameters: {
              allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
              allowedCardNetworks: ['AMEX', 'DISCOVER', 'JCB', 'MASTERCARD', 'VISA']
            }
          }]
        }
      }];

      const details = {
        total: {
          label: `Photo2Calendar Premium - ${request.plan}`,
          amount: {
            currency: request.currencyCode,
            value: request.amount
          }
        }
      };

      const paymentRequest = new PaymentRequest(supportedInstruments, details);
      const paymentResponse = await paymentRequest.show();
      
      // Process payment
      const success = await this.processPaymentResponse(paymentResponse, request);
      
      if (success) {
        await paymentResponse.complete('success');
        toast.success('🎉 Payment successful! Premium features activated.');
        return true;
      } else {
        await paymentResponse.complete('fail');
        toast.error('Payment processing failed. Please try again.');
        return false;
      }
    } catch (error) {
      console.error('Web payment failed:', error);
      
      if (error instanceof Error && error.name === 'AbortError') {
        toast.info('Payment cancelled by user.');
      } else {
        toast.error('Payment failed. Please try again.');
      }
      
      return false;
    }
  }

  /**
   * Process web payment response
   */
  private static async processPaymentResponse(response: PaymentResponse, request: PaymentRequest): Promise<boolean> {
    try {
      // In a real app, send payment details to your backend
      console.log('Processing payment response:', response);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Store purchase information
      localStorage.setItem('premium-purchase', JSON.stringify({
        plan: request.plan,
        amount: request.amount,
        purchaseDate: new Date().toISOString(),
        productId: request.productId,
        paymentMethod: response.methodName
      }));
      
      return true;
    } catch (error) {
      console.error('Payment response processing failed:', error);
      return false;
    }
  }

  /**
   * Simulate payment for demo purposes
   */
  private static async simulatePayment(request: PaymentRequest): Promise<boolean> {
    try {
      toast.info('Demo mode: Simulating payment...');
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Store simulated purchase
      localStorage.setItem('premium-purchase', JSON.stringify({
        plan: request.plan,
        amount: request.amount,
        purchaseDate: new Date().toISOString(),
        productId: request.productId,
        demo: true
      }));
      
      toast.success('🎉 Demo payment successful! Premium features activated.');
      return true;
    } catch (error) {
      console.error('Simulated payment failed:', error);
      return false;
    }
  }

  /**
   * Get payment methods available
   */
  static async getAvailablePaymentMethods(): Promise<string[]> {
    const methods: string[] = [];
    
    try {
      if (await this.isGooglePayAvailable()) {
        methods.push('Google Pay');
      }
      
      if ('PaymentRequest' in window) {
        methods.push('Credit Card');
      }
      
      // Always available as fallback
      methods.push('Demo Payment');
    } catch (error) {
      console.error('Error checking payment methods:', error);
    }
    
    return methods.length > 0 ? methods : ['Demo Payment'];
  }

  /**
   * Format currency amount
   */
  static formatCurrency(amount: number, currency: string = 'NGN'): string {
    try {
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2
      }).format(amount);
    } catch (error) {
      // Fallback formatting if Intl.NumberFormat fails
      return `${currency} ${amount.toFixed(2)}`;
    }
  }

  /**
   * Check if user has active premium subscription
   */
  static hasPremiumSubscription(): boolean {
    try {
      const purchase = localStorage.getItem('premium-purchase');
      if (!purchase) return false;
      
      const purchaseData = JSON.parse(purchase);
      
      if (purchaseData.plan === 'lifetime') {
        return true;
      }
      
      if (purchaseData.plan === 'monthly') {
        const purchaseDate = new Date(purchaseData.purchaseDate);
        const now = new Date();
        const monthsDiff = (now.getFullYear() - purchaseDate.getFullYear()) * 12 + 
                          (now.getMonth() - purchaseDate.getMonth());
        return monthsDiff < 1;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking premium subscription:', error);
      return false;
    }
  }

  /**
   * Get purchase information
   */
  static getPurchaseInfo(): any {
    try {
      const purchase = localStorage.getItem('premium-purchase');
      return purchase ? JSON.parse(purchase) : null;
    } catch (error) {
      console.error('Error getting purchase info:', error);
      return null;
    }
  }
}
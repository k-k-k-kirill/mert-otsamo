// Cart Form Submission
(function() {
  'use strict';
  
  function initCartForm() {
    const quantityInputs = document.querySelectorAll('.cart-item-quantity-input');
    const cartForm = document.querySelector('.cart-form');
    
    if (!quantityInputs.length || !cartForm) {
      return; // Not on cart page
    }

    // Handle plus/minus button clicks
    const plusButtons = document.querySelectorAll('.cart-quantity-button--plus');
    const minusButtons = document.querySelectorAll('.cart-quantity-button--minus');

    plusButtons.forEach(button => {
      button.addEventListener('click', function() {
        const key = this.dataset.key;
      const input = document.querySelector(`.cart-item-quantity-input[data-key="${key}"]`);
        const display = document.querySelector(`.cart-item-quantity-display[data-key="${key}"]`);
      if (!input) return;

        let quantity = parseInt(input.value, 10) || 0;
      const inventoryStr = input.dataset.inventory;

        // Check inventory limits
      if (inventoryStr && inventoryStr !== '') {
        const inventory = parseInt(inventoryStr, 10);
          if (!isNaN(inventory) && quantity >= inventory) {
            return; // Already at max
          }
        }

        quantity += 1;
        input.value = quantity;
        if (display) {
          display.textContent = quantity;
        }
        
        // Submit the form to update cart
        cartForm.submit();
      });
    });

    minusButtons.forEach(button => {
      button.addEventListener('click', function() {
        const key = this.dataset.key;
        const input = document.querySelector(`.cart-item-quantity-input[data-key="${key}"]`);
        const display = document.querySelector(`.cart-item-quantity-display[data-key="${key}"]`);
        if (!input) return;

        let quantity = parseInt(input.value, 10) || 0;
        if (quantity <= 0) return;

        quantity -= 1;
        input.value = quantity;
        if (display) {
          display.textContent = quantity;
        }
        
        // Submit the form to update cart
        cartForm.submit();
      });
    });

    // Handle quantity input changes - submit form on change
    quantityInputs.forEach(input => {
      input.addEventListener('change', function() {
        let quantity = parseInt(this.value, 10) || 0;
        const inventoryStr = this.dataset.inventory;

        // Validate against inventory
        if (inventoryStr && inventoryStr !== '') {
          const inventory = parseInt(inventoryStr, 10);
          if (!isNaN(inventory) && quantity > inventory) {
            quantity = inventory;
            this.value = inventory;
            alert(`Only ${inventory} items available in stock.`);
          }
        }

        // Ensure non-negative
        if (quantity < 0) {
          quantity = 0;
          this.value = 0;
        }

        // Submit the form to update cart
        cartForm.submit();
      });

      // Validate input in real-time
      input.addEventListener('input', function() {
        const inventoryStr = this.dataset.inventory;
        let quantity = parseInt(this.value, 10);
        
        // Validate in real-time (only if tracking is enabled)
        if (inventoryStr && inventoryStr !== '') {
          const inventory = parseInt(inventoryStr, 10);
          if (!isNaN(inventory)) {
            // Enforce max value
            if (isNaN(quantity) || quantity < 0) {
              quantity = 0;
            }
            if (quantity > inventory) {
              quantity = inventory;
            }
            this.value = quantity;
          }
        } else {
          // Even without inventory tracking, ensure non-negative
          if (isNaN(quantity) || quantity < 0) {
            this.value = 0;
          }
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCartForm);
  } else {
    initCartForm();
  }
})();

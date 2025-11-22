// Product page JavaScript
(function() {
  'use strict';

  // Extended color name to hex mapping
  const colorMap = {
    'black': '#000000',
    'brown': '#8B4513',
    'white': '#FFFFFF',
    'grey': '#808080',
    'gray': '#808080',
    'red': '#FF0000',
    'blue': '#0000FF',
    'green': '#008000',
    'yellow': '#FFFF00',
    'orange': '#FFA500',
    'pink': '#FFC0CB',
    'purple': '#800080',
    'navy': '#000080',
    'beige': '#F5F5DC',
    'tan': '#D2B48C',
    'cream': '#FFFDD0',
    'ivory': '#FFFFF0',
    'bronze': '#CD7F32',
    'gold': '#FFD700',
    'silver': '#C0C0C0',
    'khaki': '#F0E68C',
    'olive': '#808000',
    'maroon': '#800000',
    'burgundy': '#800020',
    'coral': '#FF7F50',
    'turquoise': '#40E0D0',
    'teal': '#008080',
    'lavender': '#E6E6FA',
    'mint': '#98FB98',
    'peach': '#FFDAB9',
    'salmon': '#FA8072'
  };

  // Function to get color hex from color name or value
  function getColorHex(colorName, colorValue) {
    // First try the color value (from metafield or direct hex)
    if (colorValue && colorValue.trim() !== '') {
      // Check if it's already a hex code
      if (/^#[0-9A-Fa-f]{6}$/i.test(colorValue.trim())) {
        return colorValue.trim();
      }
      // Try to extract hex from the value
      const hexMatch = colorValue.match(/#?([0-9A-Fa-f]{6})/i);
      if (hexMatch) {
        return '#' + hexMatch[1];
      }
      // Check if it's a 3-digit hex
      const hexMatch3 = colorValue.match(/#?([0-9A-Fa-f]{3})/i);
      if (hexMatch3) {
        const hex = hexMatch3[1];
        return '#' + hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      }
    }
    
    // Fall back to color name mapping
    if (!colorName || colorName.trim() === '') return '#CCCCCC';
    const normalized = colorName.toLowerCase().trim();
    return colorMap[normalized] || generateColorFromName(normalized);
  }

  // Generate a color from a name if not in the map
  function generateColorFromName(name) {
    // Simple hash function to generate consistent colors from names
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Generate a color with good saturation and brightness
    const hue = Math.abs(hash) % 360;
    return 'hsl(' + hue + ', 70%, 50%)';
  }

  // Function to find variant by size and color
  function findVariant(productVariants, size, color) {
    for (let i = 0; i < productVariants.length; i++) {
      const variant = productVariants[i];
      if (variant.option1 === size) {
        if (color && variant.option2 === color) {
          return variant;
        } else if (!color) {
          return variant;
        }
      }
    }
    return null;
  }

  // Function to update size buttons based on selected color
  function updateSizeButtons(sizeButtons, variantInput, productVariants, selectedColor) {
    if (!selectedColor) {
      // If no color selected, show sizes as available if ANY variant with that size is available
      sizeButtons.forEach(function(button) {
        const size = button.getAttribute('data-size');
        let anyAvailableVariant = null;
        
        // Find any available variant with this size (any color)
        for (let i = 0; i < productVariants.length; i++) {
          const variant = productVariants[i];
          if (variant.option1 === size && variant.available) {
            anyAvailableVariant = variant;
            break;
          }
        }
        
        if (anyAvailableVariant) {
          button.disabled = false;
          button.classList.remove('product-size-button--unavailable');
          button.setAttribute('data-variant-id', anyAvailableVariant.id);
        } else {
          button.disabled = true;
          button.classList.add('product-size-button--unavailable');
        }
      });
      return;
    }

    // Color is selected - check availability for that specific color+size combination
    sizeButtons.forEach(function(button) {
      const size = button.getAttribute('data-size');
      const variant = findVariant(productVariants, size, selectedColor);

      if (variant) {
        button.disabled = !variant.available;
        button.setAttribute('data-variant-id', variant.id);
        
        if (!variant.available) {
          button.classList.add('product-size-button--unavailable');
        } else {
          button.classList.remove('product-size-button--unavailable');
        }

        // Update active state if this is the current size
        if (button.classList.contains('product-size-button--active')) {
          variantInput.value = variant.id;
        }
      } else {
        button.disabled = true;
        button.classList.add('product-size-button--unavailable');
      }
    });
  }

  // Function to update color buttons based on selected size
  function updateColorButtons(colorButtons, variantInput, selectedColorInput, productVariants, selectedSize) {
    let activeColorStillAvailable = false;
    let firstAvailableColor = null;

    if (!selectedSize) {
      // If no size is selected, show all color buttons
      colorButtons.forEach(function(button) {
        button.style.display = '';
        button.disabled = false;
        button.classList.remove('product-color-button--unavailable');
      });
      return;
    }

    colorButtons.forEach(function(button) {
      const color = button.getAttribute('data-color');
      const variant = findVariant(productVariants, selectedSize, color);
      const isActive = button.classList.contains('product-color-button--active');

      if (variant && variant.available) {
        // Show and enable the button if variant exists and is available
        button.style.display = '';
        button.disabled = false;
        button.classList.remove('product-color-button--unavailable');

        // Track if active color is still available
        if (isActive) {
          activeColorStillAvailable = true;
          variantInput.value = variant.id;
        }

        // Track first available color in case we need to switch
        if (!firstAvailableColor) {
          firstAvailableColor = { color: color, variant: variant };
        }
      } else {
        // Hide the button if variant doesn't exist or is unavailable
        button.style.display = 'none';
        button.disabled = true;

        // If the active color becomes unavailable, remove active state
        if (isActive) {
          button.classList.remove('product-color-button--active');
        }
      }
    });

    // If active color became unavailable, switch to first available color
    if (!activeColorStillAvailable && firstAvailableColor && selectedColorInput) {
      selectedColorInput.value = firstAvailableColor.color;
      variantInput.value = firstAvailableColor.variant.id;
      
      // Update active state
      colorButtons.forEach(function(button) {
        button.classList.remove('product-color-button--active');
        if (button.getAttribute('data-color') === firstAvailableColor.color) {
          button.classList.add('product-color-button--active');
        }
      });
    }
  }

  // Initialize product page functionality
  function initProductPage() {
    // Get product data from JSON script tag
    const productDataScript = document.getElementById('product-data');
    if (!productDataScript) {
      return; // Exit if not on product page
    }

    const productData = JSON.parse(productDataScript.textContent);
    const productImages = productData.images || [];
    const productVariants = productData.variants || [];

    // Thumbnail gallery functionality
    const thumbnails = document.querySelectorAll('.product-thumbnail');
    const mainImage = document.getElementById('product-main-image');

    if (thumbnails.length > 0 && mainImage) {
      thumbnails.forEach(function(thumbnail, index) {
        thumbnail.addEventListener('click', function() {
          // Update main image
          if (productImages[index]) {
            mainImage.src = productImages[index].src;
            mainImage.alt = productImages[index].alt;
          }

          // Update active thumbnail
          thumbnails.forEach(function(thumb) {
            thumb.classList.remove('product-thumbnail--active');
          });
          thumbnail.classList.add('product-thumbnail--active');
        });
      });
    }

    // Set color swatch backgrounds dynamically
    // Use color_hex from variant data if available (from Shopify Color metaobject)
    const colorSwatches = document.querySelectorAll('.product-color-swatch');
    colorSwatches.forEach(function(swatch) {
      const colorName = swatch.getAttribute('data-color-name');
      const colorValue = swatch.getAttribute('data-color-value');
      
      // Try to get color_hex from variant data first (from Shopify Color metaobject)
      let colorHex = null;
      if (colorName && productVariants.length > 0) {
        for (let i = 0; i < productVariants.length; i++) {
          if (productVariants[i].option2 === colorName && productVariants[i].color_hex) {
            colorHex = productVariants[i].color_hex;
            break;
          }
        }
      }
      
      // Fall back to getColorHex function if no color_hex from variant
      if (!colorHex || colorHex === '') {
        colorHex = getColorHex(colorName, colorValue);
      }
      
      swatch.style.backgroundColor = colorHex;
      
      // Add border for light colors
      const normalizedName = (colorName || '').toLowerCase();
      const normalizedValue = (colorValue || '').toLowerCase();
      if (normalizedName.includes('white') || normalizedName.includes('cream') || normalizedName.includes('ivory') ||
          normalizedValue.includes('white') || normalizedValue.includes('cream') || normalizedValue.includes('ivory') ||
          colorHex.toLowerCase() === '#ffffff' || colorHex.toLowerCase() === '#fff') {
        swatch.style.border = '1px solid #E0E0E0';
      }
    });

    const variantInput = document.getElementById('product-variant-id');
    const selectedColorInput = document.getElementById('selected-color');
    const colorButtons = document.querySelectorAll('.product-color-button');
    const sizeButtons = document.querySelectorAll('.product-size-button');

    // Get initial selected size (if any)
    let selectedSize = null;
    const activeSizeButton = document.querySelector('.product-size-button--active');
    if (activeSizeButton) {
      selectedSize = activeSizeButton.getAttribute('data-size');
    }

    // Handle color button selection
    if (colorButtons.length > 0 && selectedColorInput) {
      colorButtons.forEach(function(button) {
        button.addEventListener('click', function() {
          // Don't allow selection if button is hidden or disabled
          if (button.style.display === 'none' || button.disabled) return;

          const selectedColor = button.getAttribute('data-color');
          selectedColorInput.value = selectedColor;

          // Update active state
          colorButtons.forEach(function(btn) {
            btn.classList.remove('product-color-button--active');
          });
          button.classList.add('product-color-button--active');

          // Update size buttons based on selected color
          updateSizeButtons(sizeButtons, variantInput, productVariants, selectedColor);
        });
      });
    }

    // Handle size button selection
    if (sizeButtons.length > 0 && variantInput) {
      sizeButtons.forEach(function(button) {
        button.addEventListener('click', function() {
          if (!button.disabled) {
            const clickedSize = button.getAttribute('data-size');
            selectedSize = clickedSize;
            const selectedColor = selectedColorInput ? selectedColorInput.value : null;

            // Find matching variant
            const matchingVariant = findVariant(productVariants, clickedSize, selectedColor);
            if (matchingVariant) {
              variantInput.value = matchingVariant.id;

              // Update active state
              sizeButtons.forEach(function(btn) {
                btn.classList.remove('product-size-button--active');
              });
              button.classList.add('product-size-button--active');

              // Update color buttons based on selected size
              updateColorButtons(colorButtons, variantInput, selectedColorInput, productVariants, clickedSize);
            }
          }
        });
      });
    }

    // Initialize color buttons based on selected size (if any)
    if (selectedSize) {
      updateColorButtons(colorButtons, variantInput, selectedColorInput, productVariants, selectedSize);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProductPage);
  } else {
    initProductPage();
  }
})();


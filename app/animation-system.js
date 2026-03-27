/**
 * Animation Design System for Neural Miners
 * Provides programmatic control over UI animations
 */

class AnimationSystem {
  constructor() {
    this.animations = new Map();
    this.particleSystem = null;
    this.initParticleSystem();
  }

  /**
   * Initialize the particle background system
   */
  initParticleSystem() {
    const canvas = document.getElementById('particles');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const particleCount = 50;

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 2 + 1;
        this.opacity = Math.random() * 0.5 + 0.2;
        this.color = this.getRandomColor();
      }

      getRandomColor() {
        const colors = ['#10f8ff', '#5cc8ff', '#9d52ff', '#ff4eef'];
        return colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

        this.opacity += (Math.random() - 0.5) * 0.02;
        this.opacity = Math.max(0.1, Math.min(0.7, this.opacity));
      }

      draw() {
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });
      requestAnimationFrame(animate);
    };

    animate();

    // Handle window resize
    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });
  }

  /**
   * Animate an element with a predefined animation
   * @param {HTMLElement} element - The element to animate
   * @param {string} animationType - Type of animation ('fadeIn', 'slideUp', etc.)
   * @param {Object} options - Animation options
   */
  animate(element, animationType, options = {}) {
    const {
      duration = 'var(--anim-duration-normal)',
      easing = 'var(--anim-easing-standard)',
      delay = 0,
      fillMode = 'forwards'
    } = options;

    const animationId = `anim-${Date.now()}-${Math.random()}`;
    this.animations.set(animationId, element);

    element.style.animation = `${animationType} ${duration} ${easing} ${delay}ms ${fillMode}`;

    // Clean up animation after it completes
    element.addEventListener('animationend', () => {
      this.animations.delete(animationId);
    }, { once: true });

    return animationId;
  }

  /**
   * Create a sequence of animations
   * @param {Array} sequence - Array of animation objects
   */
  async animateSequence(sequence) {
    for (const item of sequence) {
      const { element, animation, options = {}, delay = 0 } = item;
      if (delay > 0) {
        await this.delay(delay);
      }
      this.animate(element, animation, options);
    }
  }

  /**
   * Add entrance animation to panels
   */
  animatePanels() {
    const panels = document.querySelectorAll('.panel');
    panels.forEach((panel, index) => {
      panel.classList.add('anim-slide-up');
      panel.style.animationDelay = `${index * 100}ms`;
    });
  }

  /**
   * Animate button interactions
   * @param {HTMLElement} button - The button element
   */
  enhanceButton(button) {
    button.classList.add('hover-lift', 'click-scale', 'focus-glow');

    button.addEventListener('click', () => {
      this.animate(button, 'scaleIn', { duration: 'var(--anim-duration-fast)' });
    });
  }

  /**
   * Create a loading spinner animation
   * @param {HTMLElement} container - Container to add spinner to
   */
  createSpinner(container) {
    const spinner = document.createElement('div');
    spinner.className = 'anim-spinner';
    spinner.innerHTML = `
      <div class="spinner-ring"></div>
      <div class="spinner-ring"></div>
      <div class="spinner-ring"></div>
    `;
    container.appendChild(spinner);
    return spinner;
  }

  /**
   * Show success animation
   * @param {HTMLElement} element - Element to animate
   */
  showSuccess(element) {
    element.classList.add('anim-glow-pulse');
    setTimeout(() => {
      element.classList.remove('anim-glow-pulse');
    }, 2000);
  }

  /**
   * Create floating notification
   * @param {string} message - Notification message
   * @param {string} type - Type of notification ('success', 'error', 'info')
   */
  createNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type} anim-slide-down`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('anim-fade-in');
    }, 10);

    setTimeout(() => {
      notification.classList.remove('anim-slide-down', 'anim-fade-in');
      notification.classList.add('anim-slide-up');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  /**
   * Utility delay function
   * @param {number} ms - Milliseconds to delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create typing effect for text
   * @param {HTMLElement} element - Element to type text into
   * @param {string} text - Text to type
   * @param {number} speed - Typing speed in ms per character
   */
  async typeText(element, text, speed = 50) {
    element.textContent = '';
    for (let i = 0; i < text.length; i++) {
      element.textContent += text[i];
      await this.delay(speed);
    }
  }

  /**
   * Create a ripple effect on click
   * @param {HTMLElement} element - Element to add ripple to
   */
  addRippleEffect(element) {
    element.addEventListener('click', (e) => {
      const ripple = document.createElement('div');
      const rect = element.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple 0.6s linear;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        pointer-events: none;
      `;

      element.style.position = 'relative';
      element.style.overflow = 'hidden';
      element.appendChild(ripple);

      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  }

  /**
   * Create enhanced particle system with cyberpunk effects
   * @param {HTMLElement} container - Container for particles
   * @param {number} count - Number of particles
   */
  createCyberpunkParticles(container, count = 30) {
    // Clear existing particles
    container.querySelectorAll('.cyberpunk-particle').forEach(p => p.remove());

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'cyberpunk-particle';

      // Random particle types: dust, spark, energy
      const types = ['dust', 'spark', 'energy'];
      const type = types[Math.floor(Math.random() * types.length)];

      particle.classList.add(`particle-${type}`);
      particle.style.cssText = `
        position: absolute;
        pointer-events: none;
        animation: ${type === 'dust' ? 'float' : type === 'spark' ? 'sparkle' : 'energyPulse'} ${2 + Math.random() * 4}s ease-in-out infinite;
        animation-delay: ${Math.random() * 3}s;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        opacity: ${0.1 + Math.random() * 0.4};
      `;

      // Add specific styling based on type
      if (type === 'dust') {
        particle.style.width = '2px';
        particle.style.height = '2px';
        particle.style.background = `radial-gradient(circle, var(--neon-cyan) 0%, transparent 70%)`;
        particle.style.borderRadius = '50%';
      } else if (type === 'spark') {
        particle.style.width = '1px';
        particle.style.height = '8px';
        particle.style.background = `linear-gradient(to bottom, transparent, var(--neon-blue), transparent)`;
        particle.style.transform = `rotate(${Math.random() * 360}deg)`;
      } else if (type === 'energy') {
        particle.style.width = '3px';
        particle.style.height = '3px';
        particle.style.background = `var(--neon-purple)`;
        particle.style.borderRadius = '50%';
        particle.style.boxShadow = `0 0 4px var(--neon-purple)`;
      }

      container.appendChild(particle);
    }
  }

  /**
   * Create lightning arc effect
   * @param {HTMLElement} container - Container for lightning
   */
  createLightningArc(container) {
    const lightning = document.createElement('div');
    lightning.className = 'lightning-arc';
    lightning.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 2px;
      height: 100px;
      background: linear-gradient(to bottom, transparent, var(--neon-cyan), transparent);
      transform-origin: center;
      animation: lightningFlicker 0.1s ease-in-out;
      opacity: 0;
      pointer-events: none;
    `;

    container.appendChild(lightning);

    // Trigger lightning randomly
    setTimeout(() => {
      lightning.style.opacity = '1';
      setTimeout(() => {
        lightning.style.opacity = '0';
        setTimeout(() => lightning.remove(), 1000);
      }, 100);
    }, Math.random() * 5000 + 2000);
  }

  /**
   * Create holographic shield effect
   * @param {HTMLElement} element - Element to add shield to
   */
  addHolographicShield(element) {
    const shield = document.createElement('div');
    shield.className = 'holographic-shield';
    shield.style.cssText = `
      position: absolute;
      top: -10px;
      left: -10px;
      right: -10px;
      bottom: -10px;
      border: 2px solid var(--neon-cyan);
      border-radius: 50%;
      background: linear-gradient(45deg, transparent, rgba(16, 248, 255, 0.1), transparent);
      animation: shieldScan 3s linear infinite, shieldGlow 2s ease-in-out infinite;
      pointer-events: none;
    `;

    element.style.position = 'relative';
    element.appendChild(shield);

    // Add scan line effect
    const scanLine = document.createElement('div');
    scanLine.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent, var(--neon-blue), transparent);
      animation: scanLine 3s linear infinite;
    `;
    shield.appendChild(scanLine);
  }

  /**
   * Create glitch text effect for titles
   * @param {HTMLElement} element - Text element to glitch
   */
  createGlitchText(element) {
    element.classList.add('glitch-text');
    element.style.cssText += `
      position: relative;
      animation: textGlitch 0.3s ease-in-out;
    `;

    // Create glitch overlay
    const glitch1 = element.cloneNode(true);
    const glitch2 = element.cloneNode(true);

    glitch1.className = 'glitch-overlay glitch-1';
    glitch2.className = 'glitch-overlay glitch-2';

    element.parentNode.appendChild(glitch1);
    element.parentNode.appendChild(glitch2);

    // Remove glitch after animation
    setTimeout(() => {
      glitch1.remove();
      glitch2.remove();
    }, 300);
  }

  /**
   * Create energy core pulsing effect
   * @param {HTMLElement} element - Element to add pulsing to
   */
  addEnergyCorePulse(element) {
    element.classList.add('energy-core');
    element.style.cssText += `
      animation: energyCorePulse 2s ease-in-out infinite;
    `;
  }

  /**
   * Initialize cyberpunk theme animations
   */
  initCyberpunkTheme() {
    // Enhanced particle system
    const canvas = document.getElementById('particles');
    if (canvas) {
      this.createCyberpunkParticles(canvas.parentNode, 40);
    }

    // Add lightning effects randomly
    setInterval(() => {
      if (Math.random() < 0.3) { // 30% chance every 5 seconds
        const container = document.querySelector('.glass-shell') || document.body;
        this.createLightningArc(container);
      }
    }, 5000);

    // Add holographic shield to main button
    const mainButton = document.getElementById('tapMineBtn');
    if (mainButton) {
      this.addHolographicShield(mainButton);
      this.addEnergyCorePulse(mainButton);
    }

    // Add glitch effect to title
    const title = document.querySelector('h1');
    if (title) {
      setTimeout(() => this.createGlitchText(title), 1000);
    }
  }
}

// CSS for spinner and notifications
const animationStyles = `
<style>
.anim-spinner {
  display: inline-block;
  position: relative;
  width: 20px;
  height: 20px;
}

.spinner-ring {
  position: absolute;
  border: 2px solid rgba(16, 248, 255, 0.3);
  border-radius: 50%;
  border-top: 2px solid var(--neon-cyan);
  width: 100%;
  height: 100%;
  animation: rotate 1s linear infinite;
}

.spinner-ring:nth-child(2) {
  animation-delay: 0.33s;
}

.spinner-ring:nth-child(3) {
  animation-delay: 0.66s;
}

.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 8px;
  color: white;
  font-family: 'Inter', sans-serif;
  z-index: 1000;
  min-width: 250px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.notification-success {
  background: rgba(20, 128, 84, 0.9);
  border: 1px solid rgba(16, 248, 255, 0.5);
}

.notification-error {
  background: rgba(220, 53, 69, 0.9);
  border: 1px solid rgba(255, 78, 239, 0.5);
}

.notification-info {
  background: rgba(13, 110, 253, 0.9);
  border: 1px solid rgba(92, 200, 255, 0.5);
}
</style>
`;

// Inject styles
document.head.insertAdjacentHTML('beforeend', animationStyles);

// Initialize animation system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.animationSystem = new AnimationSystem();

  // Enhance all buttons
  document.querySelectorAll('button').forEach(button => {
    window.animationSystem.enhanceButton(button);
  });

  // Animate panels on load
  window.animationSystem.animatePanels();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnimationSystem;
}
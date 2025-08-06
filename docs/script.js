document.addEventListener('DOMContentLoaded', () => {
    // Initialize GSAP plugins
    gsap.registerPlugin(ScrollTrigger);
    
    // Check if Draggable is loaded
    if (typeof Draggable !== 'undefined') {
        console.log("GSAP Draggable loaded successfully");
    } else {
        console.error("GSAP Draggable not loaded! Make sure to include the Draggable plugin.");
    }
    
    // Elements
    const sections = document.querySelectorAll('.section');
    const timeMarker = document.querySelector('.time-marker');
    const timeTrack = document.querySelector('.time-indicator');
    const mainNav = document.querySelector('.main-nav');
    const closeNav = document.querySelector('.close-nav');
    const navLinks = document.querySelectorAll('.main-nav a');
    const cloudLayers = document.querySelectorAll('.cloud-layer');
    const timeSections = document.querySelectorAll('.time-section');
    const skyContainer = document.querySelector('.sky-container');
    
    // Get sun element with multiple methods to ensure we capture it
    const sunMoon = document.getElementById('sun-trigger');
    console.log("Sun element by ID:", sunMoon);
    
    const sunByQuerySelector = document.querySelector('.sun-moon');
    console.log("Sun element by class:", sunByQuerySelector);
    
    // Use whichever selection method successfully found the element
    const sunElement = sunMoon || sunByQuerySelector;
    console.log("Final sun element to use:", sunElement);
    
    // Time of day variables
    const timeOfDayColors = {
        sunset: {
            sky: ['#FF7F50', '#6A5ACD'],
            sunMoon: {
                color: '#FDB813',
                shadow: '#FDB813'
            }
        },
        dusk: {
            sky: ['#614385', '#516395'],
            sunMoon: {
                color: '#FDB813',
                shadow: 'rgba(253, 184, 19, 0.5)'
            }
        },
        night: {
            sky: ['#16222A', '#3A6073'],
            sunMoon: {
                color: '#FFFFFF',
                shadow: 'rgba(255, 255, 255, 0.5)'
            }
        },
        dawn: {
            sky: ['#4B79A1', '#283E51'],
            sunMoon: {
                color: '#FFFFFF',
                shadow: 'rgba(255, 255, 255, 0.8)'
            }
        },
        sunrise: {
            sky: ['#FF9966', '#FF5E62'],
            sunMoon: {
                color: '#FDB813',
                shadow: '#FDB813'
            }
        }
    };
    
    // Current section tracker
    let currentSectionIndex = 0;
    const totalSections = sections.length;
    
    // Add a direct toggle function for the navbar
    function toggleNav(show) {
        console.log("Toggle nav called, show:", show);
        if (show) {
            mainNav.classList.add('visible');
        } else {
            mainNav.classList.remove('visible');
        }
    }
    
    // Update the UI based on the current section index
    function updateUI(index, animate = true) {
        const section = sections[index];
        const timeOfDay = section.getAttribute('data-time');
        const colors = timeOfDayColors[timeOfDay];
        
        // Update time marker position
        const progress = index / (totalSections - 1);
        
        if (animate) {
            gsap.to(timeMarker, {
                top: `${progress * 100}%`,
                duration: 0.5,
                ease: 'power2.out'
            });
        } else {
            gsap.set(timeMarker, {
                top: `${progress * 100}%`
            });
        }
        
        // Update sky colors
        gsap.to(skyContainer, {
            background: `linear-gradient(to bottom, ${colors.sky[0]}, ${colors.sky[1]})`,
            duration: animate ? 1 : 0,
            ease: 'power2.out'
        });
        
        // Update sun/moon
        if (sunElement) {
            gsap.to(sunElement, {
                background: colors.sunMoon.color,
                boxShadow: `0 0 50px ${colors.sunMoon.shadow}`,
                duration: animate ? 1 : 0,
                ease: 'power2.out'
            });
            
            // Update sun/moon position (straight line from top left to top right)
            gsap.to(sunElement, {
                left: `${10 + (progress * 80)}%`, // From 10% to 90% horizontally
                top: '10%', // Stays at 10% from top (straight line)
                duration: animate ? 1 : 0,
                ease: 'power2.out'
            });
        }
        
        // Scroll to section if needed
        if (animate) {
            section.scrollIntoView({ behavior: 'smooth' });
        }
        
        currentSectionIndex = index;
    }
    
    // Initialize the first section
    updateUI(0, false);
    
    // Set up fixed-section scrolling
    function handleScrollSnap() {
        const scrollPosition = window.scrollY;
        const windowHeight = window.innerHeight;
        
        // Find which section is currently in view
        sections.forEach((section, index) => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            
            if (
                scrollPosition >= sectionTop - windowHeight / 2 && 
                scrollPosition < sectionTop + sectionHeight - windowHeight / 2
            ) {
                if (currentSectionIndex !== index) {
                    updateUI(index, false);
                }
            }
        });
    }
    
    // Wheel event to control single-section scrolling
    let isScrolling = false;
    window.addEventListener('wheel', (e) => {
        if (!isScrolling) {
            isScrolling = true;
            
            if (e.deltaY > 0 && currentSectionIndex < totalSections - 1) {
                // Scroll down
                updateUI(currentSectionIndex + 1);
            } else if (e.deltaY < 0 && currentSectionIndex > 0) {
                // Scroll up
                updateUI(currentSectionIndex - 1);
            }
            
            setTimeout(() => {
                isScrolling = false;
            }, 800); // Delay to prevent rapid scrolling
        }
        
        e.preventDefault();
    }, { passive: false });
    
    // Attach sun click event with multiple methods
    if (sunElement) {
        // Method 1: Standard click event
        sunElement.addEventListener('click', function(e) {
            console.log("Sun clicked! (Method 1)");
            toggleNav(true);
        });
        
        // Method 2: Direct onclick property
        sunElement.onclick = function(e) {
            console.log("Sun clicked! (Method 2)");
            toggleNav(true);
            return false;
        };
        
        // Method 3: Add touchstart for mobile
        sunElement.addEventListener('touchstart', function(e) {
            console.log("Sun touched! (touchstart)");
            toggleNav(true);
            e.preventDefault();
        });
        
        // Make the sun more visibly clickable
        sunElement.style.cursor = 'pointer';
        console.log("All event listeners attached to sun element");
    } else {
        console.error("CRITICAL: Sun/moon element not found! Navigation will not work.");
    }
    
    // Close navigation
    if (closeNav) {
        closeNav.addEventListener('click', () => {
            toggleNav(false);
        });
    }
    
    // Navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetIndex = parseInt(link.getAttribute('data-index'));
            toggleNav(false);
            updateUI(targetIndex);
        });
    });
    
    // Make time section markers clickable
    timeSections.forEach(section => {
        section.addEventListener('click', () => {
            const index = parseInt(section.getAttribute('data-index'));
            updateUI(index);
        });
    });
    
    // Initialize draggable time marker
    if (window.Draggable && timeMarker && timeTrack) {
        try {
            Draggable.create(timeMarker, {
                type: "y",
                bounds: timeTrack,
                onDrag: function() {
                    const trackHeight = timeTrack.clientHeight - timeMarker.clientHeight;
                    const progress = this.y / trackHeight;
                    const targetIndex = Math.min(Math.max(Math.round(progress * (totalSections - 1)), 0), totalSections - 1);
                    
                    if (currentSectionIndex !== targetIndex) {
                        currentSectionIndex = targetIndex;
                        
                        // Update UI except for time marker position (which is being dragged)
                        const section = sections[targetIndex];
                        const timeOfDay = section.getAttribute('data-time');
                        const colors = timeOfDayColors[timeOfDay];
                        
                        gsap.to(skyContainer, {
                            background: `linear-gradient(to bottom, ${colors.sky[0]}, ${colors.sky[1]})`,
                            duration: 0.3,
                            ease: 'power2.out'
                        });
                        
                        gsap.to(sunElement, {
                            background: colors.sunMoon.color,
                            boxShadow: `0 0 50px ${colors.sunMoon.shadow}`,
                            left: `${10 + ((targetIndex / (totalSections - 1)) * 80)}%`,
                            duration: 0.3,
                            ease: 'power2.out'
                        });
                    }
                },
                onDragEnd: function() {
                    const trackHeight = timeTrack.clientHeight - timeMarker.clientHeight;
                    const progress = this.y / trackHeight;
                    const targetIndex = Math.min(Math.max(Math.round(progress * (totalSections - 1)), 0), totalSections - 1);
                    updateUI(targetIndex);
                }
            });
            console.log("Draggable initialized successfully");
        } catch (error) {
            console.error("Error initializing Draggable:", error);
        }
    }
    
    // Cloud cursor interaction
    document.addEventListener('mousemove', e => {
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;
        
        cloudLayers.forEach((layer, index) => {
            const speed = (index + 1) * 3;
            const offsetX = (mouseX - 0.5) * speed;
            const offsetY = (mouseY - 0.5) * speed * 0.5;
            
            gsap.to(layer, {
                duration: 1.5,
                x: offsetX + '%',
                y: offsetY + '%',
                ease: 'power2.out'
            });
        });
    });
    
    // Listen for scroll events for updating UI
    window.addEventListener('scroll', () => {
        handleScrollSnap();
    });
    
    // Handle resize events
    window.addEventListener('resize', () => {
        handleScrollSnap();
    });
    
    // Add direct console method to inspect elements
    window.inspectElements = function() {
        console.log("Sun element:", sunElement);
        console.log("Nav element:", mainNav);
        console.log("Time marker:", timeMarker);
        console.log("Time track:", timeTrack);
    };
    
    // Add a direct way to open the menu for testing
    window.openMenu = function() {
        console.log("Manual menu open triggered");
        toggleNav(true);
    };
    
    console.log("Script fully initialized!");
});
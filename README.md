# Chatura Dissanayake: Visual Communication & Data Storytelling Portfolio

This repository hosts the official portfolio website for **Chatura Dissanayake**, a professional specializing in **Visual Communication** and **Data Storytelling**. The site showcases expertise in media relations, strategic communication, data visualisation, and design for international and government institutions.

The website is a dynamic, fast, and accessible single-page application built with modern HTML, CSS, and vanilla JavaScript.

---

## Key Features

* **Dynamic Theme Toggle:** A user-controlled dark/light mode preference that persists via local storage.
* **Active Nav Link Highlighting:** Uses the **Intersection Observer API** to highlight the current section in navigation menus as the user scrolls.
* **Visualisation Carousel with Lightbox:** A custom, vanilla JavaScript-driven carousel with a fade transition for showcasing data visualisations, plus a lightbox for enlargement.
* **Capabilities Accordion:** An interactive accordion that triggers a custom **CSS skill-bar animation** when expanded.
* **Scroll-Triggered Fade-In Animation:** Utilizes the **Intersection Observer API** for a staggered fade-in effect on all main content sections.
* **Enhanced Form Handling:** Asynchronous (AJAX) form submission with loading state and user feedback.
* **Mobile-First Design:** Includes a slide-down mobile navigation menu with smooth transitions and keyboard (`Esc`) closure support.

---

## Technology Stack

| Category | Technology | Notes |
| :--- | :--- | :--- |
| **Markup** | HTML5 | Semantic structure for accessibility. |
| **Styling** | CSS3 | Custom theming using **CSS Variables**. |
| **Interactivity** | Vanilla JavaScript | All functionality, including Intersection Observer implementation, is written in native JS. |
| **Icons** | Lucide Icons | Embedded SVG icons for a scalable UI. |

---

## Customization & Setup

### 1. File Structure

### 2. Getting Started

1.  Clone this repository to your local machine.
2.  Open the `index.html` file in your preferred web browser.

### 3. Contact Form Configuration

The contact form is configured to use [Formspree](https://formspree.io/). To enable submissions to your email, you must update the form action in `index.html`:

```html
<form class="lead-capture-form" action="[https://formspree.io/f/your-form-id](https://formspree.io/f/your-form-id)" method="POST" aria-label="Contact form">

Contact
Chatura Dissanayake – consultchatura@gmail.com

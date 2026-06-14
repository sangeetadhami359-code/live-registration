# Live Event Registration Desk Portal 🎟️

A premium, high-fidelity check-in console and Wi-Fi credential provisioning dashboard designed specifically for live event desk volunteers. Rebuilt as a pure, responsive client-side web application using modern HTML5, CSS3 (Vanilla), and JavaScript.

---

## ✨ Features

*   **🎬 Immersive 4-Second Splash Screen:** Animates concentric wireless signal rings around a glowing Wi-Fi icon with progress loads.
*   **💻 Kiosk Mode Toggle:** Switches the layout to a simplified self-service card screen for student check-ins.
*   **💾 Local Storage Database:** Persistent registry storing attendees locally in browser memory (retains records on reload).
*   **📧 Automated Email Delivery:** Connects to **EmailJS SDK** to dispatch customized HTML email templates containing Wi-Fi access credentials instantly.
*   **🚨 Interactive Toast alerts:** Live feedback alerts (success, warn, error) indicating network statuses and duplication warnings.
*   **🚫 Duplicate Prevention:** Dual ID and email checking (case-insensitive) to block duplicate entries.
*   **🗑️ Quick-Delete Option:** Visual delete buttons beside every registry row to remove credentials.
*   **📥 CSV Registry Export:** Compiles and downloads the registration sheets directly in the browser.
*   **⌨️ Rapid Keyboard Navigation:** Shift focus between input boxes by pressing the `Enter` key.
*   **📊 Quick Filter Chips:** Toggle registry rows instantly by delivery status (*All, Sent, Failed, Mock*).

---

## ⚡ Quick Start

### 1. Run Locally
You do **not** need a backend server, npm installs, or node setups.
1.  Download or clone the files.
2.  **Double-click `index.html`** to launch the dashboard console directly in any web browser.

Alternatively, if you want to run it on a local HTTP port:
```bash
npx serve
```
Open `http://localhost:3000` (or the port specified).

---

## 📧 Wi-Fi Credentials & EmailJS Integration

The portal is pre-configured with the default Wi-Fi settings:
*   **Wi-Fi SSID (Network Name):** `Auditorium-Guest-HighSpeed`
*   **Wi-Fi Password:** `LiveEvent2026!`

### Setup Real Emails (Free & Instant):
To deliver Wi-Fi details directly to actual student inboxes:
1.  Create a free account on **[EmailJS](https://www.emailjs.com)**.
2.  Link your email account under **Email Services** (e.g. your Gmail).
3.  Create an **Email Template** under the templates tab using double curly braces:
    ```html
    <h3>Hi {{student_name}},</h3>
    <p>Your Wi-Fi details are:</p>
    <ul>
      <li>Network: {{wifi_ssid}}</li>
      <li>Password: {{wifi_password}}</li>
    </ul>
    ```
4.  Copy your **Public Key**, **Service ID**, and **Template ID**.
5.  In the Registration Portal, click **"Setup Email"** in the top-right header, paste the keys, and click **Save**. 

*Note: If no keys are added, the system automatically defaults to "Mock Mode," logging full email templates to your browser's Developer Tools Console (F12).*

---

## 📂 File Layout

*   [`index.html`](index.html): Volunteer layout, stats board, forms, and template modals.
*   [`style.css`](style.css): Custom variables, glassmorphism templates, input glows, keyframe rings, and filters.
*   [`app.js`](app.js): Registry indexing, validations, EmailJS dispatch caller, and CSV download blobs.
*   [`README.md`](README.md): Project overview and guides.

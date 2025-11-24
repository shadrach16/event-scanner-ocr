# 📅 Photo2Calendar: Event Flyer to Calendar AI

![Status](https://img.shields.io/badge/Status-Beta_Release-blue)
![Platform](https://img.shields.io/badge/Platform-Android_|_iOS_(Capacitor)-green)
![Tech](https://img.shields.io/badge/AI-OCR_Image_Processing-purple)

> **"Never manually type a date from a flyer again."**
> An AI-powered utility app that scans physical or digital event flyers, extracts the details (Date, Time, Venue), and automatically syncs them to your phone's native calendar.

---

## 📱 App Interface

<div align="center">
  <img src="https://github.com/shadrach16/event-scanner-ocr/blob/main/assets/scan-screen.png.jpg" alt="Scanning Interface" width="250" style="margin-right: 20px;">
  <img src="https://github.com/shadrach16/event-scanner-ocr/blob/main/assets/calendar-sync.jpg" alt="Calendar Confirmation" width="250">
  <p><em>Figure 1: The Image Scanning Process (Left) and the Auto-Populated Event Details (Right).</em></p>
</div>

---

## 🚀 The Problem & Solution

**The Problem:** In Nigeria (and globally), event invitations often come as image flyers on WhatsApp or Instagram. transferring these details to a Google/Apple Calendar requires switching apps and manually typing dates, times, and complex addresses.

**The Solution:** Photo2Calendar allows users to simply "Share" an image to the app. The AI analyzes the text and creates a calendar event instantly.

---

## ✨ Core Features

### 1. Context-Aware OCR (Nigerian Context)
Generic OCR tools often fail with stylized fonts on party flyers or specific Nigerian date formats (e.g., "20th of Nov", "No African Time").
* I fine-tuned the parsing logic to identify **venues** (Events Centers, Landmarks) vs. standard text.
* It intelligently handles "From 9pm till mama calls" or "10am Prompt" time formats.

### 2. One-Tap Calendar Sync
* Uses the **Capacitor Calendar Plugin** to interface directly with the device's native calendar (Google Calendar on Android, iCal on iOS).
* Users can review and edit details before saving.

### 3. Multi-Language Support
* The app is built to recognize English and Pidgin keywords common in local event descriptions.

---

## 🛠️ Technical Implementation

This project demonstrates the power of **Hybrid Mobile Development**:

* **Frontend Framework:** `React.js` (for the UI logic and state management).
* **Native Runtime:** `Capacitor` (wraps the web app into a native binary for Play Store/App Store).
* **AI/OCR Engine:** Integration with **Google Cloud Vision API** (or Tesseract.js) for raw text extraction, followed by a Regex/NLP parsing layer to classify data into "Date," "Time," and "Location."
* **Storage:** `SQLite` (for local history of scanned events).

---

## 👨‍💻 Developer Role

**Tunde Oluwamo**
*Full Stack & Mobile Developer*
[ linkedin.com/in/oluwamo-shadrach-740242185 ]
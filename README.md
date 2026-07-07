# Bookie 🧾

**Bookie is a free, fully open-source cost tracker for prop firm traders.**

If you buy trading challenges from prop firms, it's easy to lose track of how much you've actually spent versus how much you've actually earned. Bookie gives you one clean place to see it all:

- 📊 **Dashboard** - your gross fees, payouts, refunds, and true net profit at a glance
- 💼 **Accounts** - every challenge and funded account you've purchased, and where it stands
- 🧮 **Tax estimate** - a rough estimate of taxes on your payouts based on where you live
- 📝 **Notes** - keep your own trading notes alongside your numbers
- 🧾 **Receipt** - a fun, printable receipt-style summary of your year that you can download as an image

## Your data stays with you

Bookie is **not** a cloud service. There is no sign-up, no account, and no company server holding your information.

You download the project, run it on your own computer, and all of your data is stored **locally on your machine** in a local SQLite-style database - it never leaves your computer. Close the app, come back tomorrow, and your numbers are right where you left them.

## Fully open source

Every line of code in this project is public and free to use. You can:

- Read the code to see exactly what it does with your data (nothing sneaky - check for yourself!)
- Change it to fit your own needs
- Share it with other traders

## How to run it on your computer

You don't need to be a programmer, but you will need to install one free tool first.

### Step 1: Install Node.js

Node.js is the engine that runs the app. Download it from [nodejs.org](https://nodejs.org) and install it like any other program (choose the "LTS" version).

### Step 2: Download Bookie

Click the green **Code** button at the top of this page, then **Download ZIP**, and unzip it somewhere easy to find (like your Desktop).

Or, if you're comfortable with git:

```bash
git clone <this-repository-url>
```

### Step 3: Open a terminal in the Bookie folder

- **Mac:** open the **Terminal** app, type `cd `, drag the Bookie folder into the window, and press Enter
- **Windows:** open the Bookie folder, click the address bar, type `cmd`, and press Enter

### Step 4: Install and start

Copy and paste these two commands, pressing Enter after each one:

```bash
npm install
npm run dev
```

The first command downloads the pieces the app needs (only needed once). The second one starts the app.

### Step 5: Open it in your browser

Go to [http://localhost:3000](http://localhost:3000) in your web browser. That's it - Bookie is running entirely on your computer.

To stop it, go back to the terminal and press `Ctrl + C`. To start it again later, just run `npm run dev` from the same folder.

## Questions or ideas?

Found a bug, or wish Bookie did something it doesn't? Open an issue on this repository - contributions and suggestions are welcome. That's the beauty of open source.

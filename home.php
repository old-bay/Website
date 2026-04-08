<?php
require_once('pageIncludes/home.inc.php');
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <?php placeTabIcon(); ?>
  <title>UMBC HvZ</title>
  <meta name="description" content="Official website for the UMBC Humans vs. Zombies club.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/style.css">
  <?php htmlHeader(); ?>
</head>
<body>
<a href="#main-content" class="skip-link">Skip to main content</a>
<?php pageHeader(); ?>

<section class="hero">
  <div class="container">
    <img src="/images/hvzLogo.png" alt="" class="hero-logo" width="120" height="120">
    <h1>Welcome to UMBC HvZ</h1>
    <p>Humans vs. Zombies at the University of Maryland, Baltimore County</p>
  </div>
</section>

<main id="main-content">
  <div class="container content-grid">
    <div class="content-area">

      <div class="quick-links">
        <a href="https://discord.gg/MCfXax2" target="_blank" rel="noopener noreferrer">Discord Server</a>
        <a href="https://www.instagram.com/umbchvzclub/" target="_blank" rel="noopener noreferrer">Instagram</a>
        <a href="https://docs.google.com/forms/d/e/1FAIpQLSezwNYkhRPnGL-J7iQ6SAudrSNoiXXELAzOQdLtnGHo4dVAaA/viewform?usp=header" target="_blank" rel="noopener noreferrer">Mission Feedback</a>
        <a href="https://forms.gle/LFJcg9Kjm8ut1Cuz7" target="_blank" rel="noopener noreferrer">Invitational Registration</a>
        <a href="https://covid19.umbc.edu" target="_blank" rel="noopener noreferrer">UMBC COVID-19 Info</a>
      </div>

      <div class="notice">
        <strong>Important:</strong> ALL TOY BLASTERS are banned on UMBC campus for normal gameplay.
        Please do not bring a blaster to a club meeting. Normal gameplay consists of throwables and throwing darts.
        We are working on this, thank you.
      </div>

      <div class="info-grid">
        <div class="info-card">
          <h3>Mission Schedule</h3>
          <p>
            Mondays &mdash; 7:00 PM &mdash; SOND 109<br>
            Thursdays &mdash; 7:00 PM &mdash; SOND 109<br>
            <em>Check the sidebar for this week's planned missions.</em>
          </p>
        </div>
        <div class="info-card">
          <h3>Community Meetings</h3>
          <p>
            Every Sunday (while spring &amp; fall classes are in session) at 1:00 PM &mdash; SOND 109.<br>
            You can also attend online via our Discord.
          </p>
        </div>
      </div>

      <div class="card">
        <h2>What is Humans vs. Zombies?</h2>
        <p>
          Humans vs. Zombies is a recreational game that combines elements of Nerf wars, manhunt, tag,
          and capture the flag with unique mechanics. Humans must complete a wide variety of objectives
          while fending off zombies &mdash; who are constantly trying to infect the humans, and thus add
          to the horde.
        </p>
        <p>
          For a more complete description of the rules, visit our <a href="/rules.html">rules page</a>.
        </p>
      </div>

    </div>
    <?php printSidebar(); ?>
  </div>
</main>

<footer class="site-footer">
  <?php printFooter(); ?>
</footer>
<script src="/js/main.js"></script>
</body>
</html>

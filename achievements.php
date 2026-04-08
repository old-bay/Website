<?php
require_once('pageIncludes/achievements.inc.php');
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <?php placeTabIcon(); ?>
  <title>UMBC HvZ - Achievements</title>
  <meta name="description" content="Browse the UMBC HvZ achievement database. Earn Basic, Recruit, Veteran, and Legendary achievements.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/style.css">
  <?php htmlHeader(); ?>
</head>
<body>
<a href="#main-content" class="skip-link">Skip to main content</a>
<?php pageHeader(); ?>

<section class="page-header">
  <div class="container">
    <h1>Achievement Database</h1>
    <p>Earn achievements for noteworthy in-game accomplishments</p>
  </div>
</section>

<main id="main-content">
  <div class="container content-grid">
    <div class="content-area">

      <div class="card">
        <p>
          In addition to simply having fun at our missions, you can attempt to earn the achievements listed here.
          There are three standard achievement classes: <strong>Basic</strong>, <strong>Recruit</strong>, and
          <strong>Veteran</strong>, categorized by difficulty. Each achievement also has an affiliation:
          Human, Zombie, or Neutral.
        </p>
        <p>
          A prestigious fourth class, <strong>Legendary</strong>, exists for incredibly difficult achievements
          that may only ever be awarded to a limited number of players.
        </p>
        <p>
          <strong>All achievements must be verifiable by a moderator to be earned.</strong>
          &nbsp;&mdash;&nbsp;
          <a href="/achievementsFaq.php">Achievement FAQs</a>
        </p>
      </div>

      <?php printAchievementDatabase(); ?>

      <div class="card">
        <h2>Retired Achievements</h2>
        <p>
          The achievement system was overhauled and restarted in the Spring 2016 semester after a long period
          of inactivity. The following achievements belong to the old system and are displayed here in
          remembrance of the veterans who earned them.
        </p>
        <p><strong>These achievements will not be awarded.</strong></p>
        <?php printRetiredAchievements(); ?>
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

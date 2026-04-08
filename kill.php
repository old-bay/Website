<?php
require_once('pageIncludes/kill.inc.php');
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <?php placeTabIcon(); ?>
  <title>UMBC HvZ - Log A Kill</title>
  <meta name="description" content="Log a kill during a UMBC HvZ long game.">
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
    <h1>Log a Kill</h1>
  </div>
</section>

<main id="main-content">
  <div class="container content-grid">
    <div class="content-area">
      <div class="card">
        <?php
        if(isset($GLOBALS['killNotification']) && $GLOBALS['killNotification'] != "")
          echo '<div class="notice">' . $GLOBALS['killNotification'] . '</div>';

        if(isLoggedIn()): ?>
        <form action="" method="post">
          <div class="form-group">
            <label for="killID">Kill ID</label>
            <input class="form-control" id="killID" name="killID">
          </div>
          <div class="form-group">
            <label for="killLocation">Kill location <em>(optional)</em></label>
            <textarea class="form-control" id="killLocation" name="killLocation" rows="4"
              placeholder="Describe where this kill happened..."></textarea>
          </div>
          <button type="submit" name="submit" class="btn btn-primary">Submit</button>
        </form>
        <?php else: ?>
        <p><strong>Please <a href="/register.php">log in</a> to log your kill.</strong></p>
        <?php endif; ?>
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

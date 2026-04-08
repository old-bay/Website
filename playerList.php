<?php
require_once('pageIncludes/playerList.inc.php');
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <?php placeTabIcon(); ?>
  <title>UMBC HvZ - Player List</title>
  <meta name="description" content="Current UMBC HvZ player roster and stats.">
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
    <h1>Player List</h1>
  </div>
</section>

<main id="main-content">
  <div class="container content-grid">
    <div class="content-area">
      <div class="card">
        <form>
          <strong>Order by:</strong>
          <label style="margin: 0 0.5rem;"><input type="radio" name="order" value="name"> Name</label>
          <label style="margin: 0 0.5rem;"><input type="radio" name="order" value="kills"> Kill Count</label>
          <label style="margin: 0 0.5rem;"><input type="radio" name="order" value="survived"> Days Survived</label>
          <label style="margin: 0 0.5rem;"><input type="radio" name="order" value="creation"> Account Creation</label>
          <button type="submit" name="submit" class="btn btn-outline" style="margin-left:0.5rem;">Sort</button>
        </form>
      </div>
      <div class="table-wrapper">
        <?php printPlayerTable(); ?>
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

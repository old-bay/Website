<?php
require_once('pageIncludes/gameSummary.inc.php');
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <?php placeTabIcon(); ?>
  <title>UMBC HvZ - Game Summaries</title>
  <meta name="description" content="Long game logs and summaries.">
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
    <h1>Long Game Logs</h1>
  </div>
</section>

<main id="main-content">
  <div class="container content-grid">
    <div class="content-area">
      <?php if($_SESSION['isAdmin'] >= 1 || $_SESSION['isBetaTester'] >= 1): ?>
      <div class="card">
        <p>
          Select a long game below to view its log. Due to a bug involving legacy mechanics,
          data on kill times from 2016&ndash;2021 is very likely inaccurate and possibly missing.
          Accurate time data records the time it was <em>logged on this website</em>, not necessarily
          when the change occurred in-game.
        </p>
        <div class="form-group">
          <label for="longGameSelect">Select game</label>
          <select class="form-control" name="longGameSelect" id="longGameSelect">
            <?php
            $qret = mysql_query("SELECT * FROM long_games WHERE 1 ORDER BY startDate DESC;");
            while($ret = mysql_fetch_assoc($qret)){
              $id   = htmlspecialchars($ret['gameID']);
              $name = htmlspecialchars($ret['title']);
              echo "<option value=\"$id\">$name</option>";
            }
            ?>
          </select>
        </div>
      </div>
      <?php else: ?>
      <div class="card">
        <p>You do not have permission to view this page.</p>
      </div>
      <?php endif; ?>
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

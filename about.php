<?php
require_once('pageIncludes/about.inc.php');
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <?php placeTabIcon(); ?>
  <title>UMBC HvZ - FAQs</title>
  <meta name="description" content="Frequently asked questions about the UMBC Humans vs. Zombies club.">
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
    <h1>Frequently Asked Questions</h1>
  </div>
</section>

<main id="main-content">
  <div class="container content-grid">
    <div class="content-area">

      <nav class="card" aria-label="FAQ navigation">
        <h2>Questions</h2>
        <ul>
          <?php foreach($questions as $question): ?>
          <li><a href="#Q<?php echo $question['number']; ?>"><?php echo htmlspecialchars($question['title']); ?></a></li>
          <?php endforeach; ?>
        </ul>
      </nav>

      <?php foreach($questions as $question): ?>
      <div class="card" id="Q<?php echo $question['number']; ?>">
        <h2><?php echo htmlspecialchars($question['title']); ?></h2>
        <div><?php echo $question['answer']; ?></div>
        <p><a href="#main-content" style="font-size:0.85rem;">↑ Back to top</a></p>
      </div>
      <?php endforeach; ?>

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

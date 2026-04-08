<?php
require_once('pageIncludes/missionTools.inc.php');
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <?php placeTabIcon(); ?>
  <title>UMBC HvZ - Mission Toolkit</title>
  <meta name="description" content="Resources and guidelines for creating UMBC HvZ missions.">
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
    <h1>Mission Toolkit</h1>
    <p>So, you want to make a mission? Awesome!</p>
  </div>
</section>

<main id="main-content">
  <div class="container content-grid">
    <div class="content-area">

      <div class="card">
        <p>
          Every HvZ mission we run, whether it's a one-night or a weeklong, has a set of slides to go with it.
          Even when we don't present slides, we still maintain them for reference.
          <strong>If you want to submit a one-night or weeklong, we'll need those slides.</strong>
        </p>
      </div>

      <div class="card">
        <h2>General Mission Creation</h2>
        <p>
          All submitted slides should follow
          <a href="https://docs.google.com/a/umbc.edu/presentation/d/1RttXztFHe8tDXP7oXeCL5K2EyZhRRBxi7GW7AE6yLVE/edit#slide=id.p" target="_blank" rel="noopener noreferrer">this template</a>.
          There are two ways to edit it:
        </p>
        <p>
          <strong>Method 1 (Suggested):</strong> Open the template link above. Go to
          <em>File &rarr; Make a copy&hellip;</em> to save an editable copy to your Google Drive.
        </p>
        <p>
          <strong>Method 2:</strong> Open the template link above. Go to
          <em>File &rarr; Download as &rarr; Microsoft PowerPoint (.pptx)</em> to download
          an editable copy.
        </p>
      </div>

      <div class="card">
        <h2>One-Night Mission Structure</h2>
        <p>Every mission must include at least these 5 slides:</p>
        <ol>
          <li>A <strong>title slide</strong> with "UMBC HvZ Missions Briefing", the mission name, and creator(s)</li>
          <li>A <strong>story slide</strong> setting the scene (no mechanic details)</li>
          <li>A <strong>victory conditions slide</strong> with win/loss conditions for both sides</li>
          <li>A <strong>special rules slide</strong> explaining the mission's mechanics</li>
          <li>A <strong>summary slide</strong> with the map*, restated objectives, stun/death timers**, and final hold info***</li>
        </ol>
        <p class="text-muted">
          *Maps are available <a href="/maps" target="_blank">here</a>. Contact the officers for a custom map.
          <br>**Stun timer is set by officers based on attendance; note any mechanic-based changes in presenter notes.
          <br>***Final hold format: "for Xmins. &mdash; (nc./cm.) &mdash; last Ymins"
        </p>
      </div>

      <div class="card">
        <h2>Weeklong Mission Structure</h2>
        <p>A weeklong requires at least 3 parts:</p>
        <ol>
          <li>A <strong>pre-game slide set</strong> containing:
            <ol type="i">
              <li>Title slide with weeklong name and creator(s)</li>
              <li>Story slide with overarching narrative (no mechanic details)</li>
              <li>Special rules slide for overarching weeklong rules</li>
            </ol>
          </li>
          <li><strong>Five mission slide sets</strong> (one-night format), each labeled with the intended day</li>
          <li>A <strong>requirements list</strong> in
            <a href="https://docs.google.com/document/d/1tmSqFP7wA4SX3xjIMgwzXCc9WvL_EHnIObKCTe5-QXI/edit?usp=sharing" target="_blank" rel="noopener noreferrer">this format</a>
          </li>
        </ol>
        <p class="text-muted">
          *Officers will add pre-game rules to the slides.
          <br>**Every weeklong map should use the
          <a href="/maps/Full Campus Map 2024.png" target="_blank">Full Campus Map</a>
          (may be altered/divided as needed).
        </p>
      </div>

      <div class="card">
        <h2>Submitting</h2>
        <p>
          Once your slides are finished, submit them to the officers at
          <a href="mailto:umbchvzofficers@gmail.com">umbchvzofficers@gmail.com</a>.
          They will be reviewed by the mission selection team within a reasonable time.
        </p>
        <p>
          One final note: <strong>Don't change things in the middle of a mission.</strong>
          For example, don't cut the stun timer in half if zombies complete an objective &mdash;
          there's no reliable way to inform all players of a mid-game rule change.
        </p>
        <p>Thanks for helping! <strong>&mdash; The UMBC HvZ Officers</strong></p>
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

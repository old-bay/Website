<?php
require_once('pageIncludes/home.inc.php');
if(!isset($_SESSION)) session_start();
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['postID'])) {
    if (isset($_SESSION['isAdmin']) && $_SESSION['isAdmin'] >= 2) {
        $id = mysql_real_escape_string($_POST['postID']);
        mysql_query("DELETE FROM blog_posts WHERE postID = " . $id);
        header('Location: '.$_SERVER['PHP_SELF']);
        exit;
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <?php placeTabIcon(); ?>
  <title>UMBC HvZ - News</title>
  <meta name="description" content="Latest news and announcements from the UMBC Humans vs. Zombies club.">
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
    <h1>News &amp; Announcements</h1>
  </div>
</section>

<main id="main-content">
  <div class="container content-grid">
    <div class="content-area">
      <?php displayPosts(0, 5); ?>
    </div>
    <?php printSidebar(); ?>
  </div>
</main>

<footer class="site-footer">
  <?php printFooter(); ?>
</footer>

<form id="deleteForm" method="post" style="display:none">
  <input type="hidden" name="postID" id="deletePostID" value="">
</form>

<script src="/js/main.js"></script>
<script defer>
var deleteButtons = document.getElementsByClassName("delete");
var confirmButtons = document.getElementsByClassName("confirm");
var isAdmin = <?php echo (isset($_SESSION['isAdmin']) && $_SESSION['isAdmin'] >= 2) ? 'true' : 'false'; ?>;

for(let i = 0; i < deleteButtons.length; i++) {
  deleteButtons[i].onclick = function() {
    confirmButtons[i].style.display = "inline-block";
  };
  confirmButtons[i].onclick = function() {
    if (!isAdmin) return;
    document.getElementById('deletePostID').value = confirmButtons[i].id;
    document.getElementById('deleteForm').submit();
  };
}
</script>
</body>
</html>

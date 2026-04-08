<?php
require_once('pageIncludes/passwordRecovery.inc.php');
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <?php placeTabIcon(); ?>
  <title>UMBC HvZ - Password Recovery</title>
  <meta name="description" content="Recover your UMBC HvZ account username or password.">
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
    <h1>Account Recovery</h1>
  </div>
</section>

<main id="main-content">
  <div class="container content-grid">
    <div class="content-area">

      <?php if($result): ?>
      <div class="notice"><strong><?php echo htmlspecialchars($result); ?></strong></div>
      <?php endif; ?>

      <div class="info-grid" style="grid-template-columns: 1fr 1fr;">
        <div class="card">
          <h3>I know my username, but forgot my password</h3>
          <form method="post" action="">
            <div class="form-group">
              <label for="reset-username">Username</label>
              <input class="form-control" type="text" id="reset-username" name="username">
            </div>
            <button type="submit" name="reset" class="btn btn-primary">Reset password</button>
          </form>
        </div>
        <div class="card">
          <h3>I forgot my username and password</h3>
          <form method="post" action="">
            <div class="form-group">
              <label for="recover-email">Email address</label>
              <input class="form-control" type="text" id="recover-email" name="email">
            </div>
            <button type="submit" name="reset" class="btn btn-primary">Recover account</button>
          </form>
        </div>
      </div>

      <div class="card">
        <h3>I have a password reset code</h3>
        <form method="post" action="">
          <div class="form-group">
            <label for="reset-code">Reset code</label>
            <input class="form-control" type="text" id="reset-code" name="code"<?php if(array_key_exists("code", $_GET)) echo ' value="'.htmlspecialchars($_GET['code']).'"'; ?>>
          </div>
          <div class="form-group">
            <label for="new-password">New password</label>
            <input class="form-control" type="password" id="new-password" name="password">
          </div>
          <button type="submit" class="btn btn-primary">Reset password</button>
        </form>
      </div>

    </div>
    <aside class="sidebar">
      <div class="sidebar-card">
        <?php displayLoginForm(); ?>
      </div>
    </aside>
  </div>
</main>

<footer class="site-footer">
  <?php printFooter(); ?>
</footer>
<script src="/js/main.js"></script>
</body>
</html>

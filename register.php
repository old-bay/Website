<?php
require_once('pageIncludes/register.inc.php');
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <?php placeTabIcon(); ?>
  <title>UMBC HvZ - Registration</title>
  <meta name="description" content="Create a UMBC HvZ account.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/style.css">
  <?php htmlHeader(); ?>
  <script>
  function verifyAndSubmit(){
    var text1 = document.getElementById("pwd1").value;
    var text2 = document.getElementById("pwd2").value;
    if(text1 != text2){
      alert("Passwords do not match, please retry.");
      return false;
    } else if(document.getElementById("fname").value == ""){
      alert("First name is required.");
      return false;
    } else if(document.getElementById("lname").value == ""){
      alert("Last name is required.");
      return false;
    } else if(document.getElementById("username").value == ""){
      alert("Username is required.");
      return false;
    } else if(document.getElementById("pwd1").value == ""){
      alert("A password is required.");
      return false;
    } else if(document.getElementById("email").value == ""){
      alert("An email address is required.");
      return false;
    } else {
      document.getElementById("registerForm").submit();
      return true;
    }
  }
  function checkEmail(field){
    if(field.value.match(/.*@umbc.edu/) == null && field.value != ""){
      alert("You're not using a MyUMBC email address, and will not be able to play long games. If you have a MyUMBC email, please use that; if not, you can continue to register.");
    }
  }
  </script>
</head>
<body>
<a href="#main-content" class="skip-link">Skip to main content</a>
<?php pageHeader(); ?>

<section class="page-header">
  <div class="container">
    <h1>Register</h1>
    <p>Create your UMBC HvZ account</p>
  </div>
</section>

<main id="main-content">
  <div class="container content-grid">
    <div class="content-area">
      <div class="card">
        <?php
        if(isLoggedIn()) echo '<div class="notice"><strong>Note:</strong> You are already logged in. If this is intentional, feel free to ignore this.</div>';
        if($notification != "") echo '<div class="notice">' . htmlspecialchars($notification) . '</div>';
        ?>
        <form method="post" action="" name="registerForm" id="registerForm" onsubmit="return verifyAndSubmit();">
          <div class="form-group">
            <label for="fname">First name</label>
            <input class="form-control" id="fname" name="fname"<?php if($fname != "") echo ' value="'.htmlspecialchars($fname).'"'; ?>>
          </div>
          <div class="form-group">
            <label for="lname">Last name</label>
            <input class="form-control" id="lname" name="lname"<?php if($lname != "") echo ' value="'.htmlspecialchars($lname).'"'; ?>>
          </div>
          <div class="form-group">
            <label for="email">Email address</label>
            <input class="form-control" id="email" name="email"<?php if($email != "") echo ' value="'.htmlspecialchars($email).'"'; ?> onblur="checkEmail(this);">
          </div>
          <div class="form-group">
            <label for="username">Username</label>
            <input class="form-control" id="username" name="username"<?php if($username != "") echo ' value="'.htmlspecialchars($username).'"'; ?>>
          </div>
          <div class="form-group">
            <label for="pwd1">Password</label>
            <input class="form-control" name="password" id="pwd1" type="password">
          </div>
          <div class="form-group">
            <label for="pwd2">Password (again)</label>
            <input class="form-control" name="password" id="pwd2" type="password">
          </div>
          <div class="form-group">
            <label>
              <input id="tosAgree" type="checkbox" name="tosAgree" value="1">
              I have read and agree to the <a href="/TOS.php" target="_blank">Terms of Service</a> for this website.
            </label>
          </div>
          <button type="submit" name="submit" class="btn btn-primary">Register</button>
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

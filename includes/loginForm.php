<?php
global $config;
if(!isset($_SESSION)) session_start();
if(!isset($loginUpdate)) include $_SERVER['DOCUMENT_ROOT'].$config['folder']."/includes/loginUpdate.php";

if(isLoggedIn()){
	$uid = $_SESSION['uid'];

	$playerData = mysql_oneline("SELECT * FROM users WHERE UID='$uid'");
	$curLongGame = getCurrentLongGame();
	if($playerData && $curLongGame){
		$longPlayerData = mysql_oneline("SELECT * FROM long_players WHERE gameID='{$curLongGame['gameID']}' AND playerID='$uid'");
	}else{
		$longPlayerData = false;
	}

	$ret = mysql_fetch_assoc(mysql_query("SELECT `fname`, `uname`, `isAdmin` FROM `users` WHERE `UID`='$uid';"));
	$fname = $ret['fname'];
	?>
	<h3>Hello <?php echo $fname; ?>!</h3>
	<ul style="list-style:none; padding:0;">
	  <li><a href="/myProfile.php">My Profile</a></li>
	  <?php if($longPlayerData): ?>
	  <li><a href="/kill.php">Log a kill</a></li>
	  <?php endif; ?>
	  <?php if($_SESSION['isAdmin'] >= 1 || $playerData['isLongGameAuthed'] >= 1): ?>
	  <li><a href="/admin/">Admin Panel</a></li>
	  <?php endif; ?>
	</ul>
	<form method="post" action="" name="logoutForm">
	  <button type="submit" name="logout" class="btn btn-outline" style="width:100%;">Log out</button>
	</form>
<?php
}else{
	include_once $_SERVER['DOCUMENT_ROOT'].'/includes/saltGen.php';
	$salt = $_SESSION['salt'];
	if($GLOBALS['loginNotification'] != "") echo '<p style="color:var(--color-accent)">'.$GLOBALS['loginNotification'].'</p>';
	?>
	<h3>Login</h3>
	<form method="post" action="" name="loginForm" id="loginForm">
	  <input type="hidden" id="salt" name="salt" value="<?php echo $salt; ?>">
	  <input type="hidden" id="loginPassword" name="password">
	  <div class="form-group">
	    <label for="loginUsername">HvZ Handle</label>
	    <input type="text" class="form-control" id="loginUsername" name="username"
	      placeholder="Username"
	      onclick="if(value=='Username') value='';"
	      onblur="if(value=='') value='Username';">
	  </div>
	  <div class="form-group">
	    <label for="loginPasswordTxt">Password</label>
	    <input type="password" class="form-control" id="loginPasswordTxt"
	      placeholder="Password"
	      onclick="if(value=='password') value='';"
	      onblur="if(value=='') value='password';">
	  </div>
	  <button type="submit" name="login" class="btn btn-primary" onclick="submitLogin()" style="width:100%; margin-bottom:0.5rem;">Login</button>
	  <button type="button" class="btn btn-outline" onclick="window.location='/register.php'" style="width:100%;">Register</button>
	  <p style="margin-top:0.75rem; font-size:0.85rem;">
	    <a href="/passwordRecovery.php">Forgot username/password?</a>
	  </p>
	  <p style="font-size:0.8rem; color:var(--color-text-muted);">
	    If login doesn't work, try submitting twice. We apologize for the inconvenience.
	  </p>
	</form>
<?php
}
?>
<!-- Hooked into JS from htmlHeader.php -->
<div id="timeTxt" style="text-align:center; font-size:0.8rem; color:var(--color-text-muted);"></div>

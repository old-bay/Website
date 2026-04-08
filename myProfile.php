<?php
require_once('pageIncludes/myProfile.inc.php');
require_once('includes/update.php');
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <?php placeTabIcon(); ?>
  <title>UMBC HvZ - My Profile</title>
  <meta name="description" content="Your UMBC HvZ player profile, stats, and settings.">
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
    <h1>My Profile</h1>
  </div>
</section>

<main id="main-content">
  <div class="container content-grid">
    <div class="content-area">
      <?php
      // isAdmin >= -1 check makes it easy to restrict this page; raise the threshold to restrict.
      if(isset($_SESSION['isAdmin']) && $_SESSION['isAdmin'] >= -1) {
        if($playerData) {
          if(isset($GLOBALS['profileMessage']) && $GLOBALS['profileMessage'] != "")
            echo '<div class="notice">' . $GLOBALS['profileMessage'] . '</div>';

          echo '<h2>Hi, ' . htmlspecialchars($playerData['fname']) . '!</h2>';

          // ---- Attendance Stats ----
          $uid = $_SESSION['uid'];
          $ret = mysql_oneline("SELECT * FROM `users` WHERE `UID` = '$uid';");
          ?>

          <div class="card">
            <h2>Game &amp; Attendance Statistics</h2>

            <h3>This Semester</h3>
            <ul>
              <li>Total Appearances: <?php echo $ret['appearancesThisTerm']; ?></li>
              <li>Missions Started as Zombie/OZ: <?php echo $ret['zombieStartsThisTerm']; ?></li>
              <li>Missions Started as Human: <?php echo $ret['humanStartsThisTerm']; ?></li>
              <li>Missions Moderated: <?php echo $ret['gamesModdedThisTerm']; ?></li>
              <li>Community Meetings Attended: <?php echo $ret['adminMeetingsThisTerm']; ?></li>
            </ul>

            <h3>Cumulative</h3>
            <ul>
              <li>Total Appearances: <?php echo $ret['appearancesTotal']; ?></li>
              <li>Missions Started as Zombie/OZ: <?php echo $ret['zombieStartsTotal']; ?></li>
              <li>Missions Started as Human: <?php echo $ret['humanStartsTotal']; ?></li>
              <li>Missions Moderated: <?php echo $ret['gamesModdedTotal']; ?></li>
              <li>Community Meetings Attended (since Jan 2019): <?php echo $ret['adminMeetingsTotal']; ?></li>
            </ul>
            <p class="text-muted">
              <strong>Note:</strong> Starting-side data may not be accurate with round-based or random-OZ missions.
              Mission attendance was not accurately tracked until 2017. If you believe there is a recent
              attendance error, please contact an officer.
            </p>
            <p>If you have 5/25/50/100/250 missions but lack the corresponding achievement, it should be
            awarded when you are next signed in.</p>
            <?php
            if(canVote($uid)) {
              echo '<p><strong>You are a member of UMBC Humans vs. Zombies.</strong></p>';
            } else {
              echo '<p>You are not yet a member of UMBC Humans vs. Zombies.</p>';
            }
            $currentSemesterCount = $ret['appearancesThisTerm'];
            $lastSemesterCount    = $ret['appearancesLastTerm'];
            $sum = $currentSemesterCount + $lastSemesterCount;
            echo "<p>You have attended $currentSemesterCount meetings this semester and $lastSemesterCount last semester (total: $sum). Membership requires 5 across the current and previous semester.</p>";
            ?>
          </div>

          <div class="card">
            <h2>Other Player Records</h2>
            <h3>Waiver Status</h3>
            <?php
            $waiverStatus = denumerate('waiverStatus', $ret['hasTurnedInWaiver']);
            echo "<p>Your waiver status is <strong>$waiverStatus</strong></p>";
            ?>
            <p>
              By UMBC rules, all players must have a waiver on file each year. If your status shows "Cleared",
              our records indicate you have filed one. Records may not update immediately. If you have not filed,
              you can submit an
              <a href="https://umbcorgs.dserec.com/online/clubsports_widget/club/84/registration" target="_blank" rel="noopener noreferrer">online waiver here</a>,
              or request a paper waiver from an officer.
            </p>
          </div>

          <div class="card">
            <h2>Long Game Settings</h2>
            <?php
            if($curLongGame) {
              $title = htmlspecialchars($curLongGame['title']);
              if($longPlayerData) {
                echo "<p>Your kill code for <strong>$title</strong> is <strong>{$longPlayerData['mainKill']}</strong>.</p>";
              }
            }
            ?>

            <h3>OZ Opt-In</h3>
            <form action="" method="post">
              <div class="form-group">
                <label><input type="radio" name="ozOpt" value="in"<?php if($playerData['ozOptIn']==1) echo ' checked'; ?>> Yes, I want to be in the OZ pool</label>
              </div>
              <div class="form-group">
                <label><input type="radio" name="ozOpt" value="out"<?php if($playerData['ozOptIn']==0) echo ' checked'; ?>> No, I do not want to be in the OZ pool</label>
              </div>
              <div class="form-group">
                <label for="ozText"><strong>Brief reason for wanting to be an OZ:</strong><br>
                  <em>Leaving this blank will <u>disqualify</u> you as an OZ</em>
                </label>
                <textarea class="form-control" id="ozText" name="ozText" rows="4"><?php echo htmlspecialchars(preg_replace("/\\\\*'/","'",$playerData['ozParagraph'])); ?></textarea>
              </div>
              <button type="submit" name="ozSubmit" class="btn btn-primary">Update OZ Preferences</button>
            </form>
            <p class="text-muted">
              <strong>Note:</strong> This field does <strong>not</strong> reset weeklong to weeklong.
              You remain opted in or out with the same reason until you change it here.
            </p>

            <?php if($longPlayerData && $longPlayerData['state'] > 0): ?>
            <h3>iDied</h3>
            <p>
              Click this button <strong>only</strong> if you were tagged and the kill <strong>cannot</strong>
              be logged (kill code doesn't work or can't be found). Do not use this to suicide.
              OZs: use this to reveal yourself after your 2 days or 2 kills are over.
            </p>
            <form action="" method="post">
              <button type="submit" name="iDied" class="btn btn-outline">iDied</button>
            </form>
            <?php endif; ?>
          </div>

          <div class="card">
            <h2>Opt-In to New Features</h2>
            <p>
              You may opt in to new website features that haven't been fully tested. Problems are more likely,
              but the features add useful functionality.
            </p>
            <form action="" method="post">
              <div class="form-group">
                <label><input type="radio" name="betaOpt" value="in"<?php if($playerData['isBetaTester']==1) echo ' checked'; ?>> Yes, opt me in to beta features</label>
              </div>
              <div class="form-group">
                <label><input type="radio" name="betaOpt" value="out"<?php if($playerData['isBetaTester']==0) echo ' checked'; ?>> No, I don't want to see new features</label>
              </div>
              <button type="submit" name="betaSubmit" class="btn btn-primary">Update Preferences</button>
            </form>

            <?php if($playerData['isBetaTester'] == '1'): ?>
            <hr style="display:block; margin:1.5rem 0; border-color:var(--color-border);">
            <h3>Change Name / Username <em>(Under Construction)</em></h3>
            <p>
              Update your first name, last name, or username below. Officers reserve the right to change
              inappropriate names. Abuse of this system will result in loss of privileges.
            </p>
            <?php if($playerData['canChangeName'] == 0): ?>
              <p class="text-muted">You have been prohibited from changing your name/username. Contact the officer board if you believe this is a mistake.</p>
            <?php elseif($playerData['canChangeName'] == 1): ?>
              <p>
                Current username: <strong><?php echo htmlspecialchars($playerData['uname']); ?></strong><br>
                Current first name: <strong><?php echo htmlspecialchars($playerData['fname']); ?></strong><br>
                Current last name: <strong><?php echo htmlspecialchars($playerData['lname']); ?></strong>
              </p>
              <form action="" method="post">
                <div class="form-group">
                  <label for="new_uname">New username (leave blank for no change)</label>
                  <input class="form-control" type="text" id="new_uname" name="new_uname">
                </div>
                <div class="form-group">
                  <label for="new_fname">New first name</label>
                  <input class="form-control" type="text" id="new_fname" name="new_fname">
                </div>
                <div class="form-group">
                  <label for="new_lname">New last name</label>
                  <input class="form-control" type="text" id="new_lname" name="new_lname">
                </div>
                <button type="submit" name="updateNames" class="btn btn-primary">Update Name / Username</button>
              </form>
            <?php endif; ?>
            <?php endif; ?>
          </div>

          <div class="card">
            <h2>Change Your Profile Picture</h2>
            <p>Profile pictures must not contain gore, suggestive imagery, or memes. This system is monitored.
            Violations result in a warning on the first offense and loss of picture privileges on the second.
            The optimal image size is 100&times;100 px.</p>
            <form method="post" enctype="multipart/form-data">
              <div class="form-group">
                <label for="image">Select image</label>
                <input type="file" id="image" name="image" class="form-control">
              </div>
              <button type="submit" name="profilePicture" class="btn btn-primary">Upload</button>
            </form>
          </div>

          <div class="card">
            <h2>Achievements</h2>
            <h3>Select Favorite Achievement</h3>
            <form action="/myProfile.php" method="post">
              <div class="form-group">
                <label for="achieve">Achievement</label>
                <select class="form-control" id="achieve" name="achieve">
                  <?php generateList(); ?>
                </select>
              </div>
              <button type="submit" name="favoriteAchieve" class="btn btn-primary">Save</button>
            </form>

            <h3 style="margin-top:1.5rem;">Current Favorite Achievement</h3>
            <?php displayFavAchievement(); ?>

            <h3 style="margin-top:1.5rem;">Earned Achievements</h3>
            <?php printAchieveTable(); ?>
          </div>

        <?php } else { ?>
          <div class="card">
            <p>Please <a href="/register.php">sign in</a> to see your profile.</p>
          </div>
        <?php } ?>
      <?php } ?>
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

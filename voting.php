<?php
//This is very roughly imported from the old server, and does not conform to the new coding standards. Beware!
require_once('includes/util.php');
load_config('config.txt');
my_quick_con($config);
if(!isset($_SESSION)) session_start();
if(!isset($loginUpdate)) require_once('includes/loginUpdate.php');
$settings = get_settings();
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <?php placeTabIcon(); ?>
  <title>UMBC HvZ - Voting</title>
  <meta name="description" content="Vote in UMBC HvZ officer elections.">
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
    <h1>Meet the Candidates</h1>
  </div>
</section>

<main id="main-content">
  <div class="container content-grid">
    <div class="content-area">
      <div class="card">
        <?php
        // VOTING CONSTANTS
        $writeInThreshold = $settings['writeInThreshold'];
        $showVotesThreshold = $settings['showVotesThreshold'];

        // Display candidates
        $qury = mysql_query("SELECT position FROM officer_positions ORDER BY id ASC;");
        while($ret = mysql_fetch_assoc($qury)) {
          $curPos = $ret['position'];
          echo "<h3>" . htmlspecialchars($curPos) . "</h3>";

          $qury2 = mysql_query("SELECT * FROM election_candidates WHERE position='$curPos';");
          if(mysql_num_rows($qury2) > 0) {
            while($ret2 = mysql_fetch_assoc($qury2)) {
              $curName = htmlspecialchars($ret2['name']);
              $curBio  = htmlspecialchars($ret2['bio']);
              echo "<p><strong>$curName</strong> &mdash; $curBio</p>";
            }
          } else {
            echo "<p class=\"text-muted\">None</p>";
          }
        }

        if(!isLoggedIn()) {
          echo '<div class="notice"><strong>You must be signed in to vote!</strong></div>';
        } else {
          $uid = $_SESSION['uid'];
          $canVote = canVote($uid);

          if(!$canVote) {
            echo '<div class="notice">You are not eligible to vote. Eligibility requires being signed in to at least five meetings during the current or previous semester. If you think this is in error, please contact an admin.</div>';
          } else {
            // Load positions and existing votes
            $curVote   = array();
            $positions = array();
            $candidates = array();

            $qury = mysql_query("SELECT position FROM election_votes GROUP BY position ORDER BY position ASC;");
            while($ret = mysql_fetch_assoc($qury)){
              $curVote[$ret['position']] = "";
              $positions[] = $ret['position'];
            }

            $qury = mysql_query("SELECT position, voteFor AS name FROM election_votes GROUP BY position, voteFor;");
            while($ret = mysql_fetch_assoc($qury)){
              if(!array_key_exists($ret['position'], $candidates)) $candidates[$ret['position']] = array();
              $candidates[$ret['position']][] = $ret['name'];
            }

            // Load existing votes for this user
            $ret = mysql_oneline("SELECT COUNT(*) cnt FROM election_votes WHERE uid='$uid';");
            if($ret['cnt'] != 0){
              $qury = mysql_query("SELECT position, voteFor FROM election_votes WHERE uid='$uid';");
              while($ret = mysql_fetch_assoc($qury)){
                $curVote[$ret['position']] = $ret['voteFor'];
              }
            }

            // Save vote submission
            if(array_key_exists("submit", $_POST)){
              foreach($positions as $curPos){
                $postPos = preg_replace("/ /","_",$curPos);
                if(array_key_exists($postPos, $_POST) || $_POST[$postPos."-other"] != ""){
                  $newVote = mysql_real_escape_string(($_POST[$postPos."-other"] != "" ? $_POST[$postPos."-other"] : $_POST[$postPos]));
                  if($curVote[$curPos] != ""){
                    mysql_query("UPDATE election_votes SET voteFor='$newVote' WHERE uid='$uid' AND position='$curPos';");
                  } else {
                    mysql_query("INSERT INTO election_votes (uid, position, voteFor) VALUES ('$uid','$curPos','$newVote');");
                  }
                  $curVote[$curPos] = $newVote;
                } else {
                  mysql_query("DELETE FROM election_votes WHERE uid='$uid' AND position='$curPos';");
                }
                $numVotes = mysql_oneline("SELECT COUNT(*) cnt FROM election_votes WHERE position = '$curPos' AND voteFor = '$newVote';");
                $numVotes = $numVotes['cnt'];
                if($numVotes >= $writeInThreshold) {
                  mysql_query("DELETE FROM election_votes WHERE uid = '$defaultUID' AND position = '$curPos' AND voteFor = '$newVote';");
                  mysql_query("INSERT INTO election_votes (uid, position, voteFor) VALUES ('$defaultUID','$curPos','$newVote');");
                }
              }
              echo '<div class="notice"><strong>Vote saved!</strong></div>';
            }

            // Reload candidates after save
            $candidates = array();
            $qury = mysql_query("SELECT position, voteFor AS name FROM election_votes GROUP BY position, voteFor ORDER BY voteFor;");
            while($ret = mysql_fetch_assoc($qury)){
              if(!array_key_exists($ret['position'], $candidates)) $candidates[$ret['position']] = array();
              $candidates[$ret['position']][] = $ret['name'];
            }

            // Present voting form
            echo '<form method="post" action="">';
            foreach($positions as $curPos) {
              echo "<h4>" . htmlspecialchars($curPos) . "</h4>";
              $test = false;
              foreach($candidates[$curPos] as $curCan) {
                $inputId = htmlspecialchars($curPos . '&' . $curCan);
                $inputName = htmlspecialchars($curPos);
                $checked = ($curVote[$curPos] == $curCan && ($test = true)) ? ' checked' : '';
                echo '<label style="display:block; margin-bottom:0.25rem;"><input type="radio" id="' . $inputId . '" name="' . $inputName . '" value="' . htmlspecialchars($curCan) . '"' . $checked . '> ' . htmlspecialchars($curCan) . '</label>';
              }
              if(substr($curPos, 0, 13) != "Web Committee") {
                echo '<div class="form-group" style="margin-top:0.5rem;"><label>Write-in: <input class="form-control" name="' . htmlspecialchars($curPos) . '-other"' . ($test ? '' : ' value="' . htmlspecialchars($curVote[$curPos]) . '"') . '></label></div>';
              }
              echo '<br>';
            }

            if($settings['lockVoting'] == "unlock") {
              echo '<label style="display:block; margin-bottom:0.75rem;"><input type="checkbox" id="studentCheck" name="test" required> By checking this box and submitting, you confirm you are a current UMBC student.</label>';
              echo '<button type="submit" name="submit" class="btn btn-primary">Submit vote</button>';
            } else {
              echo '<p class="text-center"><strong>Voting is currently closed.</strong></p>';
            }
            echo '</form>';

            if($_SESSION['isAdmin'] >= 2) {
              echo '<hr style="display:block; margin: 1.5rem 0; border-color: var(--color-border);">';
              echo '<h3>Voting Results (Admin View)</h3>';
              echo getVotingResults();
            }
          }
        }
        ?>
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

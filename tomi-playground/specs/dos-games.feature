Feature: Dos games
  Visitors browse a curated catalog of shareware and freeware DOS games
  and play them in the browser with saves and on-screen controls.

  Scenario: Dos games appears in the pages menu
    Given I am on the home page
    Then the pages menu should list Dos games

  Scenario: Visitor opens the Dos games catalog
    Given I am on the Dos games page
    Then I should see the Dos games heading
    And I should see Wolfenstein 3D in the catalog
    And I should see a short shareware credit for Wolfenstein 3D

  Scenario: Visitor starts Wolfenstein 3D
    Given I am on the Dos games page
    When I play Wolfenstein 3D
    Then I should see the DOS player
    And I should be able to return to the catalog

  Scenario: Saved progress persists across visits
    Given I am playing Wolfenstein 3D with auto-save enabled
    When I leave Dos games and open it again
    Then saved progress for Wolfenstein 3D should still be available

  Scenario: Phone viewport offers on-screen controls
    Given I am on a mobile viewport
    And I am playing Wolfenstein 3D
    Then on-screen controls should be available

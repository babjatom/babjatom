Feature: Dos games
  Visitors browse a curated catalog of shareware and freeware DOS games
  and play them in the browser with saves.

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
    Then I should still see the Dos games heading
    And I should still see Wolfenstein 3D in the catalog
    And I should not see the Play Wolfenstein 3D button
    And I should see the DOS player
    And I should see a fullscreen control above the player
    And the pages menu should still offer a way to collapse the sidebar
    And I should be able to return to the catalog

  Scenario: Saved progress persists across visits
    Given I am playing Wolfenstein 3D with auto-save enabled
    When I leave Dos games and open it again
    Then saved progress for Wolfenstein 3D should still be available

  Scenario: Phone play uses a slide stick for movement
    Given I am on a mobile viewport
    And I am playing Wolfenstein 3D
    Then I should see guidance about sliding the left stick to move

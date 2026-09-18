Feature: Theme Playground
  Visitors can switch themes and fonts, inspect themed components, and browse a sample visits table.

  Scenario: Theme and font controls sit above typography
    Given I am on the Theme Playground page
    Then I should see theme and font controls
    And I should see a control to generate a random theme
    And those controls should appear above the typography sample

  Scenario: Background controls sit above theme and font controls
    Given I am on the Theme Playground page
    Then I should see background controls to choose Maze or None
    And the background controls should appear above the theme and font controls

  Scenario: Maze settings show when Maze is selected
    Given I am on the Theme Playground page
    And the Maze background is selected
    Then I should see maze density and visibility controls
    And I should see a control to regenerate the maze

  Scenario: Visitor turns the background off
    Given I am on the Theme Playground page
    When I choose the None background
    Then the ambient maze should not be shown
    And maze density and visibility controls should be hidden

  Scenario: Visitor changes maze density and visibility
    Given I am on the Theme Playground page
    And the Maze background is selected
    When I set maze density higher
    And I set maze visibility higher
    Then the ambient maze should use more passage cells for this viewport
    And the ambient maze should use the higher visibility

  Scenario: Visitor regenerates the maze
    Given I am on the Theme Playground page
    And the Maze background is selected
    When I regenerate the maze
    Then the ambient maze layout should change

  Scenario: Background and maze preferences stick after reload
    Given I am on the Theme Playground page
    When I set maze density higher
    And I set maze visibility higher
    And I choose the None background
    And I reload the page
    Then the None background should stay selected
    And the ambient maze should not be shown
    When I choose the Maze background
    Then the ambient maze should keep the denser layout
    And the ambient maze should keep the higher visibility

  Scenario: Showcase and visits table are on the page
    Given I am on the Theme Playground page
    Then I should see themed component samples
    And I should see a visits table with IP, hits, country, and last visit
    And I should see sample visit rows

  Scenario: Visitor selects a visit row
    Given I am on the Theme Playground page
    When I select a visit row
    Then the selection count should show that one row is selected

  Scenario: Visitor opens row actions
    Given I am on the Theme Playground page
    When I open the actions menu for a visit row
    Then I should see edit and delete actions

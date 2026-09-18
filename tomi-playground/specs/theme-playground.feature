Feature: Theme Playground
  Visitors can switch themes and fonts, inspect themed components, and browse a sample visits table.

  Scenario: Theme and font controls sit above typography
    Given I am on the Theme Playground page
    Then I should see theme and font controls
    And I should see a control to generate a random theme
    And those controls should appear above the typography sample

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

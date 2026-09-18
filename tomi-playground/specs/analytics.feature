Feature: Analytics
  Visitors can open a sample analytics page with a visits table and chart types.

  Scenario: Analytics sits after Ask Tomi and Theme Playground
    Given I am on the home page
    Then the pages menu should list Ask Tomi, Theme Playground, Analytics, and Dos games in that order

  Scenario: Visitor opens Analytics
    Given I am on the home page
    When I open Analytics from the pages menu
    Then I should see the Analytics heading
    And I should see sample visit data
    And I should see Area, Bar, Line, Pie, Radar, Radial, and Tooltip charts

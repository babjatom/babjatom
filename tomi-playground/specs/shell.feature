Feature: Shell navigation
  Visitors move between playground pages from the shared babjatom shell.

  Scenario: Home shows the pages menu
    Given I am on the home page
    Then I should see a welcome heading
    And the pages menu should list Theme Playground, Analytics, and Ask Tomi
    And I should see a control to generate a random theme

  Scenario: Mobile pages menu starts collapsed
    Given I am on a mobile viewport
    And I am on the home page
    Then the pages menu should be hidden
    When I show the menu
    Then the pages menu should be visible

  Scenario: Visitor opens Theme Playground from the pages menu
    Given I am on the home page
    When I open Theme Playground from the pages menu
    Then I should see the component showcase
    And I should see recent visits

  Scenario: Visitor opens Ask Tomi from the pages menu
    Given I am on the home page
    When I open Ask Tomi from the pages menu
    Then I should see the Ask Tomi chat
    And the Ask button should be disabled until I enter a question

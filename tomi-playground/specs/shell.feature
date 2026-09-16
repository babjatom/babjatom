Feature: Shell navigation
  Visitors move between playground pages from the shared babjatom shell.
  Ask Tomi is the home page.

  Scenario: Home is Ask Tomi with the pages menu
    Given I am on the home page
    Then I should see the Ask Tomi chat
    And the pages menu should list Theme Playground, Analytics, and Ask Tomi
    And I should see a control to generate a random theme
    And an ambient maze light should sit behind the page content

  Scenario: Ambient maze light stays decorative
    Given I am on the home page
    Then the ambient maze light should not capture pointer events

  Scenario: Mobile pages menu starts collapsed
    Given I am on a mobile viewport
    And I am on the home page
    Then the pages menu should be hidden
    When I show the menu
    Then the pages menu should be visible

  Scenario: Visitor dismisses the mobile menu by tapping outside
    Given I am on a mobile viewport
    And I am on the home page
    When I show the menu
    And I tap outside the menu
    Then the pages menu should be hidden

  Scenario: Visitor opens Theme Playground from the pages menu
    Given I am on the home page
    When I open Theme Playground from the pages menu
    Then I should see the component showcase
    And I should see recent visits

  Scenario: Visitor opens Ask Tomi from the pages menu
    Given I am on the Theme Playground page
    When I open Ask Tomi from the pages menu
    Then I should be on the home page
    And I should see the Ask Tomi chat
    And the Ask button should be disabled until I enter a question

  Scenario: Legacy Ask Tomi URL redirects to home
    Given I open the legacy Ask Tomi URL
    Then I should be on the home page
    And I should see the Ask Tomi chat

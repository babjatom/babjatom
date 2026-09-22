Feature: Shell navigation
  Visitors move between playground pages from the shared babjatom shell.
  Ask Tomi is the home page.

  Scenario: Home is Ask Tomi with the pages menu
    Given I am on the home page
    Then I should see the Ask Tomi chat
    And the pages menu should list Ask Tomi, Theme Playground, Analytics, and Dos games
    And an ambient maze light should sit behind the page content

  Scenario: Ambient maze light stays decorative
    Given I am on the home page
    Then the ambient maze light should not capture pointer events

  Scenario: Desktop starts with maximum maze density
    Given I am on a desktop viewport
    And I am on the home page
    Then the ambient maze should use maximum density

  Scenario: Mobile maze is half as dense as the preference
    Given I am on a tall phone viewport
    And I am on the home page
    Then the ambient maze should use half the configured density

  Scenario: Mobile maze light travels more slowly
    Given I am on a tall phone viewport
    And I am on the home page
    Then the ambient maze light should travel slower than on desktop

  Scenario: Ambient maze uses a taller grid on a tall phone
    Given I am on a tall phone viewport
    And I am on the home page
    Then the ambient maze should have more rows than columns

  Scenario: Ambient maze regenerates when the viewport is resized
    Given I am on the home page
    When I resize the viewport to a tall phone shape
    Then the ambient maze should have more rows than columns
    And the ambient maze layout should change

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

Feature: Test Ask Tomi
  A hidden trial page asks Tomi through a separate model path.
  The home page stays on the live chat.

  Scenario: Trial page shows Ask Tomi
    Given I open the trial Ask Tomi page
    Then I should see Ask Tomi
    And I should see My chat
    And the pages menu should not list the trial page

  Scenario: Trial page keeps its own chat list
    Given I have received an answer on the home Ask Tomi page
    When I open the trial Ask Tomi page
    Then I should not see that question
    And starter prompts should be visible
    When I ask a question on the trial page
    Then the question should go to the trial path
    And the home chat list should still have the earlier question
    And the home page should not keep the trial question

  Scenario: Home chat stays on the live path
    Given I am on the home Ask Tomi page
    When I ask a question
    Then the question should go to the live chat path
    And I should see My chat

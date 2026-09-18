Feature: Ask Tomi
  Visitors can ask questions about Tomi and read generated answers in this browser tab.
  Ask Tomi is the site home page.

  Scenario: Empty chat shows starter prompts
    Given I am on the Ask Tomi page
    Then I should see the Ask Tomi heading
    And the heading should sit on the same title background as Theme Playground
    And I should see a prototype disclaimer
    And I should see a Privacy link
    And I should see starter prompts
    And the Ask button should be disabled
    And I should not see a coming-soon placeholder
    And I should not see the 3D scene

  Scenario: Chat stays in one screen with an inner scroll area
    Given I am on the Ask Tomi page
    Then I should see the Ask Tomi heading
    And I should see the question composer
    And the conversation should scroll inside the chat area

  Scenario: Visitor sends a starter prompt
    Given I am on the Ask Tomi page
    When I choose the "What’s your tech stack?" starter prompt
    Then I should see my question in the chat
    And I should see the assistant answer

  Scenario: Visitor submits a typed question
    Given I am on the Ask Tomi page
    When I type a question into the composer
    And I submit it
    Then I should see the assistant answer

  Scenario: Follow-ups stay in the same conversation
    Given I have received an answer in Ask Tomi
    When I ask a follow-up question
    Then the follow-up should stay in the same conversation

  Scenario: Visitor clears the chat
    Given I have received an answer in Ask Tomi
    When I clear the chat
    Then the conversation should be gone
    And starter prompts should be visible again
    And the next question should start a new conversation

  Scenario: Visitor stops an in-flight answer
    Given I have sent a question that has not finished answering
    When I stop the request
    Then I should see that the answer was stopped

  Scenario: Visitor regenerates the latest answer
    Given I have received an answer in Ask Tomi
    When I regenerate the latest answer
    Then I should see the new answer
    And the previous answer should be gone
    And the conversation should stay the same

  Scenario: Visitor copies an answer
    Given I have received an answer in Ask Tomi
    When I copy the answer
    Then the answer should be on the clipboard
    And I should see confirmation that it was copied

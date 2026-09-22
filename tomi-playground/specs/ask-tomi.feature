Feature: Ask Tomi
  Visitors can ask questions about Tomi and read generated answers in this browser tab.
  Ask Tomi is the site home page.

  Scenario: Empty chat shows starter prompts
    Given I am on the Ask Tomi page
    Then I should see the Ask Tomi heading
    And the heading should sit on the same title background as Theme Playground
    And I should see a prototype disclaimer
    And I should see a Privacy link
    And I should see a hint to start with a suggested question
    And I should see starter prompts
    And I should see a distinctive Schedule call chip with a calendar icon
    And I should see a distinctive Download CV chip with a download icon
    And the Ask button should be disabled
    And I should not see a coming-soon placeholder
    And I should not see the 3D scene

  Scenario: Empty chat hides the suggested-question hint on a phone
    Given I am on a mobile viewport
    And I am on the Ask Tomi page
    Then I should see starter prompts
    And I should not see the suggested-question hint

  Scenario: Schedule call and Download CV sit on one row on a phone
    Given I am on a mobile viewport
    And I am on the Ask Tomi page
    Then the Schedule call and Download CV chips should sit on the same row

  Scenario: Empty chat centers starter prompts when they fit
    Given I am on the Ask Tomi page
    Then I should see starter prompts
    And the starter prompts should sit in the conversation area

  Scenario: Empty chat does not show an inner scrollbar when content fits
    Given I am on the Ask Tomi page
    Then I should see the Ask Tomi heading
    And the Ask Tomi heading should not be clipped
    And I should see the question composer
    And the conversation area should not scroll when starters fit
    And the conversation area should not look like a bordered panel

  Scenario: Empty chat scrolls starter prompts when they do not fit
    Given I am on a short mobile viewport
    And I am on the Ask Tomi page
    Then I should see starter prompts
    And the conversation area should scroll so I can reach every starter
    And the first starter prompt should not be clipped


  Scenario: Active chat scrolls inside the conversation area
    Given I have received an answer in Ask Tomi
    Then the conversation should scroll inside the chat area
    And the conversation area should not look like a bordered panel

  Scenario: Active chat quiets the header and composer
    Given I have received an answer in Ask Tomi
    Then I should see the Ask Tomi heading
    And I should not see the Ask Tomi subtitle
    And I should not see the prototype disclaimer until I focus the composer
    And I should not see a Privacy link in the composer until I focus it
    When I focus the question composer
    Then I should see a prototype disclaimer
    And I should see a Privacy link

  Scenario: Active chat uses a compact auto-growing composer
    Given I have received an answer in Ask Tomi
    Then the question composer should start on one line
    And the question composer should show a short follow-up placeholder
    And the question composer should not show a scrollbar until the question is long

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

  Scenario: Schedule call chip nudges paste
    Given I am on the Ask Tomi page
    When I choose the Schedule call chip
    Then the composer should prompt me to paste a Cal.com link
    And I should not see an assistant answer yet

  Scenario: Download CV chip starts a PDF download
    Given I am on the Ask Tomi page
    When I choose the Download CV chip
    Then a CV PDF download should start
    And I should not see an assistant answer yet

  Scenario: Pasting a Cal.com link previews slots
    Given I am on the Ask Tomi page
    When I paste a Cal.com scheduling link and submit
    Then I should see a schedule preview with open times
    And the chat API should not have been called
    And the scheduler should not have booked yet

  Scenario: Choosing a previewed slot books it
    Given I have a schedule preview with open times in Ask Tomi
    When I reply with 2
    Then I should see the booked schedule result in the chat

  Scenario: Declining a schedule preview cancels
    Given I have a schedule preview with open times in Ask Tomi
    When I reply with no
    Then I should see that scheduling was cancelled
    And the scheduler should not have booked

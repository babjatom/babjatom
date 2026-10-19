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
    And I should see a distinctive Download CV chip with a download icon and a chevron
    And the Download CV chip should come before the Schedule call chip
    And on a phone the Download CV chip should match the Schedule call chip in size
    And on a wide screen the Download CV chip should grow to the width of the two starter lines
    And I should see a distinctive Schedule call chip with a calendar icon
    And the Ask button should be disabled
    And I should not see a coming-soon placeholder
    And I should not see the 3D scene

  Scenario: Empty chat hides the suggested-question hint on a phone
    Given I am on a mobile viewport
    And I am on the Ask Tomi page
    Then I should see starter prompts
    And I should not see the suggested-question hint

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
    And that chat should not stay in the sidebar
    And starter prompts should be visible again
    And the next question should start a new conversation

  Scenario: Sidebar lists My chat
    Given I am on the Ask Tomi page
    Then I should see "My chat" in the sidebar
    And "My chat" should sit below Pages and above Privacy
    And I should see a "New chat" button
    And I should not see "Current chat"

  Scenario: New chat keeps the previous conversation in the sidebar
    Given I have received an answer in Ask Tomi
    When I start a new chat
    Then starter prompts should be visible again
    And the previous chat should stay in the sidebar
    And the next question should start a new conversation

  Scenario: Visitor opens a previous chat
    Given I have started a new chat after an answered question
    When I choose the previous chat in the sidebar
    Then I should see that chat's question and answer
    And that chat should stay in the sidebar under its question
    And the other chat should stay in the sidebar
    When I ask a follow-up question
    Then the follow-up should stay in that conversation

  Scenario: Refresh restores chats from the last 30 minutes
    Given I have a previous chat and an open chat with an answer
    When I refresh the page
    Then I should see the open question and answer
    And I should see the open chat in the sidebar under its question
    And I should see the previous chat in the sidebar

  Scenario: New chat stops after three chats
    Given I have three chats in the sidebar
    Then the New chat button should be disabled
    When I clear the open chat
    Then the New chat button should be available

  Scenario: A chat idle for more than 30 minutes disappears
    Given I have a chat that has been idle for more than 30 minutes
    When I open the Ask Tomi page
    Then I should not see that chat in the sidebar
    And I should not see that chat's question
    And starter prompts should be visible

  Scenario: Chat list stays on the Ask Tomi page
    Given I am on the Theme Playground page
    Then I should not see "My chat"

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

  Scenario: Schedule call chip shows open times
    Given I am on the Ask Tomi page
    When I choose the Schedule call chip
    Then I should see the Schedule call request in the chat
    And I should see an assistant answer with open times
    And the answer should say to reply with a number to book or no to cancel
    And the chat API should not have been called
    And the scheduler should not have booked yet

  Scenario: Download CV chip lists the CV choices
    Given I am on the Ask Tomi page
    When I open the Download CV chip
    Then I should see Fullstack CV, Frontend CV, Backend CV, and Match to your JD
    And each choice should be as wide as the Download CV chip
    And Match to your JD should be lighter than the other choices
    And I should not see an assistant answer yet

  Scenario: Choosing Match to your JD does nothing yet
    Given I am on the Ask Tomi page
    When I open the Download CV chip
    And I choose Match to your JD
    Then a CV PDF download should not start
    And I should not see an assistant answer yet

  Scenario: Choosing Fullstack CV starts a PDF download
    Given I am on the Ask Tomi page
    When I open the Download CV chip
    And I choose Fullstack CV
    Then the full-stack CV PDF download should start
    And I should not see an assistant answer yet

  Scenario: Choosing Frontend CV starts a PDF download
    Given I am on the Ask Tomi page
    When I open the Download CV chip
    And I choose Frontend CV
    Then the frontend CV PDF download should start
    And I should not see an assistant answer yet

  Scenario: Choosing Backend CV starts a PDF download
    Given I am on the Ask Tomi page
    When I open the Download CV chip
    And I choose Backend CV
    Then the backend CV PDF download should start
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

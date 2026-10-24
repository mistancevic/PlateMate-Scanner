# Board DT84 and DT85 (Milan 23 October 20:58, from Tester 3's call; drawn 24 October 00:37). Drawn on the live app (0.2.85)
# with a joined coach; the New screens are the same pages with the change drawn in. Nothing built.
S = __import__("os").environ.get("BOARDS_DIR", __import__("os").path.dirname(__import__("os").path.abspath(__file__)))
exec("\n".join(open(f"{S}/genRS.py").read().split("\n")[:32]))
CHIP["now"] = ("#5b6b8a", "#fff", "0.2.85, as it is")
CHIP["changed"] = ("#2e7be8", "#fff", "New, drawn for your approval")
B = Board(); y = 30
cy = storyCard(B, y, "DT84", "Share with Coach Milan after making a meal", [
  ("Your finding, 20:58", "During Tester 3's test, one step near the end of making a recipe had a Share with Milan button, and then never again."),
  ("Why", "The button sits only on How was it?, under Save. Save lands on the recipe page, and the recipe page has no share. Today's card for the meal has one further down, and it says Share with Coach, without your name."),
  ("How was it?", "The button stays where it is and names you as the app names the coach everywhere: Share with Coach Milan."),
  ("The recipe page after Save, 00:46", "The top of the recipe page is for the recipe, so no block of its own there: the share goes into the Made today card that is already there. Two versions to choose from."),
  ("Version 1, mine", "A link at the end of the card's one line: You ate your plate. Share with Coach Milan ›. It adds no height. Once shared: ✓ Shared with Coach Milan."),
  ("Version 2, yours", "A share icon in the card's top line, next to Today. Once shared, the icon turns into a tick and the line says Shared with Coach Milan."),
  ("In both", "A tap opens the same three answers as on Today, under the line: Look at this, Was this OK?, Help me next time, Cancel. Shared already on How was it?: the card shows it as shared."),
  ("Today", "The meal's card says Share with Coach Milan, not Share with Coach."),
  ("Only with a coach", "A person without a coach sees none of this, as now."),
])
cy = 30 + int((cy - 30) * 0.88)
h = rowEnd(cy,
  B.screen("DT84a", 0, y, "Now: How was it?", "dt8485NowSave", "now", "Share with Milan, under Save."),
  B.screen("DT84b", 1, y, "Now: after Save", "dt8485NowLanded", "now", "Made today. No share."),
  B.screen("DT84c", 2, y, "Now: Today", "dt8485NowToday", "now", "Share with Coach, no name."))
y = h
h = rowEnd(B.screen("DT84d", 0, y, "New: How was it?", "dt8485NewSave", "changed", "Share with Coach Milan."),
  B.screen("DT84e", 1, y, "New: Today", "dt8485NewToday", "changed", "Share with Coach Milan."))
y = h
CHIP["v1"] = ("#2e7be8", "#fff", "Version 1, mine")
CHIP["v2"] = ("#7a3fd1", "#fff", "Version 2, yours")
h = rowEnd(B.screen("DT84f", 0, y, "V1: after Save", "dt84vV1", "v1", "A link at the end of the line."),
  B.screen("DT84g", 1, y, "V1: after the tap", "dt84vV1Ask", "v1", "The three answers under the line."),
  B.screen("DT84h", 2, y, "V1: shared", "dt84vV1Done", "v1", "✓ Shared with Coach Milan."))
y = h
h = rowEnd(B.screen("DT84i", 0, y, "V2: after Save", "dt84vV2", "v2", "A share icon next to Today."),
  B.screen("DT84j", 1, y, "V2: after the tap", "dt84vV2Ask", "v2", "The three answers under the line."),
  B.screen("DT84k", 2, y, "V2: shared", "dt84vV2Done", "v2", "The icon turns into a tick."))
y = h
CHIP["built"] = ("#1d7a46", "#fff", "Built in 0.2.86")
cy = storyCard(B, y, "Built, 0.2.86", "Version 1, the card under the photos", [
  ("Your call, 09:44", "The link is better, although not what you wanted; let's see how people react. The Made today card goes below the photo, not between the title and the photo. DT85: approved, the UX can follow later."),
  ("Built", "The recipe page after Save: title, the cover (your photo from today), the photos, then Made today with Share with Coach Milan ›. A tap: Look at this, Was this OK?, Help me next time. Then ✓ Shared with Coach Milan, and Today's card says Shared. Remove it asks Sure? Remove it."),
  ("Journeys", "New walkthrough made-cover: the photo becomes the cover, the card sits under the photo, no share without a coach, Remove it takes two taps, a cover of your own stays. The share link was checked with a test person who has Coach Milan, as in these screens."),
])
cy = y + int((cy - y) * 0.88)
h = rowEnd(cy,
  B.screen("DT86a", 0, y, "Built: How was it?", "dt8485BuiltSave", "built", "Share with Coach Milan."),
  B.screen("DT86b", 1, y, "Built: after Save", "dt8485BuiltLanded", "built", "The cover first, then Made today."),
  B.screen("DT86c", 2, y, "Built: the Made today card", "dt8485BuiltCard", "built", "Share with Coach Milan ›"))
y = h
h = rowEnd(B.screen("DT86d", 0, y, "Built: after the tap", "dt8485BuiltAsk", "built", "The three answers."),
  B.screen("DT86e", 1, y, "Built: shared", "dt8485BuiltShared", "built", "✓ Shared with Coach Milan."),
  B.screen("DT86f", 2, y, "Built: Today", "dt8485BuiltToday", "built", "The card says Shared."))
y = h + 40
cy = storyCard(B, y, "DT85", "Your photo from making it is the cover", [
  ("Your finding, 20:58", "The photo taken while making the meal was in the recipe's photos, but not the cover. It sat there, and nothing said it could be the cover, so Tester 3 had Chef Mealan draw one instead of using his real photo."),
  ("Why", "A recipe without any cover shows an empty Add a photo box, and the plate photo only as a small thumbnail with a plus. The question Use this photo as the cover? on Today comes only when the cover is a picture Chef Mealan drew."),
  ("The rule, your words", "Display it by default; whoever wants to change or delete it does so."),
  ("No cover, or a drawn one", "The first photo taken while making it becomes the cover. The drawn picture stays behind it among the recipe's photos. Under the cover: Your photo from today is the cover. Members see it only if you pick it when you share. Change the cover, Remove it."),
  ("A cover of your own already", "It stays. The new photo joins the recipe's photos, as the plus thumbnail does now."),
  ("Today", "The question Use this photo as the cover? goes away, since the photo already is."),
  ("Members", "Sharing with members still asks which photo goes out, as now."),
])
cy = y + int((cy - y) * 0.88)
h = rowEnd(cy,
  B.screen("DT85a", 0, y, "Now: after Save", "dt8485NowOffer", "now", "Empty cover. Your photo is a small plus thumbnail."),
  B.screen("DT85b", 1, y, "New: after Save", "dt84vV1", "changed", "Your photo is the cover. Change it or remove it."))
y = h
W = SX + 4 * (SW + GAP) - GAP + 70
board("Stories57.dc.html", "DT84 and DT85. Share with Coach Milan, and your photo as the cover", "24 October 2026 (Milan 23 October 20:58, from Tester 3's call; DT84 redrawn after 00:46 and 00:48 in two versions). Test data: Chicken rice bowl, made from My recipes with one photo, a person with Coach Milan. Now: 0.2.85 as it is. New: the same screens with the change drawn in. DT84 version 1 and DT85 approved on 24 October 09:44 and built in 0.2.86, not released.", B, W, y - 100, "Stories56.dc.html")

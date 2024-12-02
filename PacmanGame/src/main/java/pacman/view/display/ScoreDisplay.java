package pacman.view.display;

import javafx.scene.Node;
import javafx.scene.layout.VBox;
import javafx.scene.paint.Color;
import javafx.scene.text.Font;
import javafx.scene.text.Text;

/**
 * Displays the score of the player
 */
public class ScoreDisplay implements Display {
    private final VBox node;
    private final Text scoreText;
    private int totalScore = 0;

    public ScoreDisplay(Font font) {
        this.node = new VBox();
        this.node.setLayoutX(10);
        this.node.setLayoutY(20);
        this.scoreText = new Text(String.valueOf(totalScore));
        this.scoreText.setFill(Color.WHITE);
        this.scoreText.setFont(font);

        this.node.getChildren().add(this.scoreText);
    }

    public void update(int scoreChange) {
        this.totalScore += scoreChange;
        this.scoreText.setText(String.valueOf(totalScore));
    }

    @Override
    public Node getNode() {
        return this.node;
    }
}

package pacman.view.display;

import javafx.scene.Node;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;
import javafx.scene.layout.HBox;

/**
 * Displays the number of lives of player
 */
public class NumLivesDisplay implements Display {

    private static final Image IMAGE = new Image("maze/pacman/playerRight.png");
    private final HBox node;

    public NumLivesDisplay() {
        this.node = new HBox(10);
        this.node.setLayoutX(10);
        this.node.setLayoutY(545);
    }

    public void update(int numLives) {
        this.node.getChildren().clear();
        for (int i = 0; i < numLives; i++) {
            this.node.getChildren().add(new ImageView(IMAGE));
        }
    }

    @Override
    public Node getNode() {
        return this.node;
    }
}

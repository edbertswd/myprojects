package pacman.view.display;

import javafx.application.Platform;
import javafx.scene.Node;
import javafx.scene.layout.HBox;
import javafx.scene.paint.Color;
import javafx.scene.text.Font;
import javafx.scene.text.Text;
import pacman.model.engine.observer.GameState;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Displays the game status - win, lose, ready
 */
public class GameStateDisplay implements Display {

    private final Text text;
    private final HBox node;

    public GameStateDisplay(Font font) {
        this.node = new HBox();

        this.text = new Text();
        this.node.setLayoutY(320);
        this.text.setFont(font);
        this.text.setViewOrder(0);
        this.node.getChildren().add(this.text);
    }

    public void update(GameState gameState) {
        this.text.setVisible(true);
        switch (gameState) {
            case GAME_OVER:
                this.node.setLayoutX(153);
                this.text.setFill(Color.RED);
                this.text.setText("GAME OVER");
                closeGame();
                break;
            case PLAYER_WIN:
                this.node.setLayoutX(162);
                this.text.setFill(Color.WHITE);
                this.text.setText("YOU WIN!");
                closeGame();
                break;
            case READY:
                this.node.setLayoutX(180);
                this.text.setFill(Color.YELLOW);
                this.text.setText("READY!");
                break;
            case IN_PROGRESS:
                this.text.setVisible(false);
                break;
        }
    }

    private void closeGame() {
        // exit after 5 seconds
        ScheduledExecutorService ses = Executors.newScheduledThreadPool(1);
        ses.schedule(Platform::exit, 5, TimeUnit.SECONDS);
        ses.shutdown();
    }

    @Override
    public Node getNode() {
        return this.node;
    }
}

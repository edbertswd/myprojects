package pacman.view.display;

import javafx.scene.Node;
import javafx.scene.text.Font;
import pacman.model.engine.observer.GameState;
import pacman.model.engine.observer.GameStateObserver;
import pacman.model.level.observer.LevelStateObserver;
import pacman.view.GameWindow;

import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.util.ArrayList;
import java.util.List;

/**
 * Manages the display nodes for Pac-Man
 */
public class DisplayManager implements LevelStateObserver, GameStateObserver {

    private final ScoreDisplay scoreDisplay;
    private final GameStateDisplay gameStatusDisplay;
    private final NumLivesDisplay numLivesDisplay;

    public DisplayManager() {

        Font font;
        try {
            font = Font.loadFont(new FileInputStream(GameWindow.FONT_FILE), 16);
        } catch (FileNotFoundException e) {
            font = new Font(16);
        }

        this.scoreDisplay = new ScoreDisplay(font);
        this.gameStatusDisplay = new GameStateDisplay(font);
        this.numLivesDisplay = new NumLivesDisplay();
    }

    public List<Node> getNodes() {
        List<Node> nodes = new ArrayList<>();
        nodes.add(scoreDisplay.getNode());
        nodes.add(gameStatusDisplay.getNode());
        nodes.add(numLivesDisplay.getNode());
        return nodes;
    }

    @Override
    public void updateNumLives(int numLives) {
        numLivesDisplay.update(numLives);
    }

    @Override
    public void updateScore(int scoreChange) {
        scoreDisplay.update(scoreChange);
    }

    @Override
    public void updateGameState(GameState gameState) {
        gameStatusDisplay.update(gameState);
    }
}

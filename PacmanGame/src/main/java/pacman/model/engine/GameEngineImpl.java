package pacman.model.engine;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import pacman.model.engine.observer.GameState;
import pacman.model.engine.observer.GameStateObserver;
import pacman.model.entity.Renderable;
import pacman.model.factories.*;
import pacman.model.level.Level;
import pacman.model.level.LevelImpl;
import pacman.model.level.observer.LevelStateObserver;
import pacman.model.maze.Maze;
import pacman.model.maze.MazeCreator;
import java.util.ArrayList;
import java.util.List;

/**
 * Implementation of GameEngine - responsible for coordinating the Pac-Man model
 */
public class GameEngineImpl implements GameEngine {

    private final RenderableFactoryRegistry renderableFactoryRegistry;
    private final List<GameStateObserver> observers;
    private final List<LevelStateObserver> levelStateObservers;
    private Level currentLevel;
    private int numLevels;
    private int currentLevelNo;
    private Maze maze;
    private JSONArray levelConfigs;
    private GameState gameState;

    public GameEngineImpl(String configPath) {
        this.renderableFactoryRegistry = getRenderableFactoryRegistry();
        this.currentLevelNo = 0;
        this.observers = new ArrayList<>();
        this.levelStateObservers = new ArrayList<>();

        init(new GameConfigurationReader(configPath));
    }

    private RenderableFactoryRegistry getRenderableFactoryRegistry() {
        RenderableFactoryRegistry renderableFactoryRegistry = new RenderableFactoryRegistryImpl();
        renderableFactoryRegistry.registerFactory(RenderableType.HORIZONTAL_WALL, new WallFactory(RenderableType.HORIZONTAL_WALL));
        renderableFactoryRegistry.registerFactory(RenderableType.VERTICAL_WALL, new WallFactory(RenderableType.VERTICAL_WALL));
        renderableFactoryRegistry.registerFactory(RenderableType.UP_LEFT_WALL, new WallFactory(RenderableType.UP_LEFT_WALL));
        renderableFactoryRegistry.registerFactory(RenderableType.UP_RIGHT_WALL, new WallFactory(RenderableType.UP_RIGHT_WALL));
        renderableFactoryRegistry.registerFactory(RenderableType.DOWN_LEFT_WALL, new WallFactory(RenderableType.DOWN_LEFT_WALL));
        renderableFactoryRegistry.registerFactory(RenderableType.DOWN_RIGHT_WALL, new WallFactory(RenderableType.DOWN_RIGHT_WALL));
        renderableFactoryRegistry.registerFactory(RenderableType.PELLET, new PelletFactory());
        renderableFactoryRegistry.registerFactory(RenderableType.PACMAN, new PacmanFactory());
        renderableFactoryRegistry.registerFactory(RenderableType.GHOST, new GhostFactory());
        renderableFactoryRegistry.registerFactory(RenderableType.BLINKY, new GhostFactory());
        renderableFactoryRegistry.registerFactory(RenderableType.INKY, new GhostFactory());
        renderableFactoryRegistry.registerFactory(RenderableType.SPEEDY, new GhostFactory());
        renderableFactoryRegistry.registerFactory(RenderableType.CLYDE, new GhostFactory());
        renderableFactoryRegistry.registerFactory(RenderableType.POWER_PELLET, new PowerPelletFactory());
        return renderableFactoryRegistry;
    }

    private void init(GameConfigurationReader gameConfigurationReader) {
        // Set up map
        String mapFile = gameConfigurationReader.getMapFile();
        MazeCreator mazeCreator = new MazeCreator(mapFile, renderableFactoryRegistry);
        this.maze = mazeCreator.createMaze();
        this.maze.setNumLives(gameConfigurationReader.getNumLives());

        // Get level configurations
        this.levelConfigs = gameConfigurationReader.getLevelConfigs();
        this.numLevels = levelConfigs.size();
        if (levelConfigs.isEmpty()) {
            System.exit(0);
        }
    }

    @Override
    public List<Renderable> getRenderables() {
        return this.currentLevel.getRenderables();
    }

    @Override
    public void moveUp() {
        currentLevel.moveUp();
    }

    @Override
    public void moveDown() {
        currentLevel.moveDown();
    }

    @Override
    public void moveLeft() {
        currentLevel.moveLeft();
    }

    @Override
    public void moveRight() {
        currentLevel.moveRight();
    }

    @Override
    public void startGame() {
        startLevel();
    }

    private void startLevel() {
        JSONObject levelConfig = (JSONObject) levelConfigs.get(currentLevelNo);
        // reset renderables to starting state
        maze.reset();
        this.currentLevel = new LevelImpl(levelConfig, maze);
        for (LevelStateObserver observer : this.levelStateObservers) {
            this.currentLevel.registerObserver(observer);
        }
        this.setGameState(GameState.READY);

    }

    @Override
    public void tick() {
        if (currentLevel.getNumLives() == 0) {
            handleGameOver();
            return;
        }

        if (currentLevel.isLevelFinished()) {
            handleLevelEnd();
            return;
        }

        currentLevel.tick();
    }

    private void handleLevelEnd() {
        if (numLevels - 1 == currentLevelNo) {
            handlePlayerWins();
        } else {
            this.currentLevelNo += 1;

            // remove observers
            for (LevelStateObserver observer : this.levelStateObservers) {
                this.currentLevel.removeObserver(observer);
            }

            startLevel();
        }
    }

    private void handleGameOver() {
        if (gameState != GameState.PLAYER_WIN) {
            setGameState(GameState.GAME_OVER);
            currentLevel.handleGameEnd();
        }
    }

    private void handlePlayerWins() {
        if (gameState != GameState.PLAYER_WIN) {
            setGameState(GameState.PLAYER_WIN);
            currentLevel.handleGameEnd();
        }
    }

    private void setGameState(GameState gameState) {
        this.gameState = gameState;
        notifyObserversWithGameState();
    }

    @Override
    public void registerObserver(GameStateObserver observer) {
        this.observers.add(observer);
    }

    @Override
    public void notifyObserversWithGameState() {
        for (GameStateObserver observer : observers) {
            observer.updateGameState(this.gameState);
        }
    }

    @Override
    public void registerLevelStateObserver(LevelStateObserver observer) {
        this.levelStateObservers.add(observer);
    }
}


package pacman.model.level;

import org.json.simple.JSONObject;

import javafx.scene.image.Image;
import pacman.ConfigurationParseException;
import pacman.model.engine.observer.GameState;
import pacman.model.entity.Renderable;
import pacman.model.entity.dynamic.DynamicEntity;
import pacman.model.entity.dynamic.ghost.Ghost;
import pacman.model.entity.dynamic.ghost.GhostImpl;
import pacman.model.entity.dynamic.ghost.GhostMode;
import pacman.model.entity.dynamic.ghost.State.EdibleInterface;
import pacman.model.entity.dynamic.ghost.Strategy.BlinkyStrategy;
import pacman.model.entity.dynamic.physics.PhysicsEngine;
import pacman.model.entity.dynamic.physics.Vector2D;
import pacman.model.entity.dynamic.player.Controllable;
import pacman.model.entity.dynamic.player.Pacman;
import pacman.model.entity.staticentity.StaticEntity;
import pacman.model.entity.staticentity.collectable.Collectable;
import pacman.model.entity.staticentity.collectable.PowerPellet;
import pacman.model.level.observer.LevelStateObserver;
import pacman.model.maze.Maze;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Concrete implement of Pac-Man level
 */
public class LevelImpl implements Level {

    private static final int START_LEVEL_TIME = 100;
    private final Maze maze;
    private final List<LevelStateObserver> observers;
    private List<Renderable> renderables;
    private Controllable player;
    private List<Ghost> ghosts;
    private int tickCount;
    private Map<GhostMode, Integer> modeLengths;
    private int numLives;
    private int points;
    private GameState gameState;
    private List<Renderable> collectables;
    private GhostMode currentGhostMode;

    private boolean frightenedModeActive = false;
    private int frightenedModeTimer;
    private Map<GhostImpl, Image> originalImages;
    private int consecutiveGhostsEaten;

    private int pacmanInvulnerabilityTimer = 0;
    private static final int PACMAN_BUFFER_DURATION = 60; // 1 second at 60 fps
    public boolean isPacmanInvulnerable = false;

    private static final int[] FRIGHTENED_MODE_POINTS = {200, 400, 800, 1600}; // Points for consecutive ghosts



    public LevelImpl(JSONObject levelConfiguration,
                     Maze maze) {
        this.renderables = new ArrayList<>();
        this.maze = maze;
        this.tickCount = 0;
        this.observers = new ArrayList<>();
        this.modeLengths = new HashMap<>();
        this.gameState = GameState.READY;
        this.currentGhostMode = GhostMode.SCATTER;
        this.points = 0;
        this.frightenedModeTimer = 0;
        this.originalImages = new HashMap<>();
        this.consecutiveGhostsEaten = 0;
        this.frightenedModeActive = false;

        initLevel(new LevelConfigurationReader(levelConfiguration));
    }

    private void initLevel(LevelConfigurationReader levelConfigurationReader) {
        // Fetch all renderables for the level
        this.renderables = maze.getRenderables();

        //Make sure everything resets
        this.currentGhostMode = GhostMode.SCATTER;
        this.points = 0;
        this.frightenedModeTimer = 0;
        this.originalImages = new HashMap<>();
        this.consecutiveGhostsEaten = 0;
        this.frightenedModeActive = false;


        // Set up player
        if (!(maze.getControllable() instanceof Controllable)) {
            throw new ConfigurationParseException("Player entity is not controllable");
        }
        this.player = (Controllable) maze.getControllable();
        this.player.setSpeed(levelConfigurationReader.getPlayerSpeed());
        setNumLives(maze.getNumLives());

        // Set up ghosts
        this.ghosts = maze.getGhosts().stream()
                .map(element -> (Ghost) element)
                .collect(Collectors.toList());
        Map<GhostMode, Double> ghostSpeeds = levelConfigurationReader.getGhostSpeeds();

        for (Ghost ghost : this.ghosts) {
            ghost.exitFrightenedMode();
            player.registerObserver(ghost);
            ghost.setSpeeds(ghostSpeeds);
            ghost.setGhostMode(this.currentGhostMode);
            this.originalImages.put((GhostImpl)ghost, ghost.getImage());
        }
        this.modeLengths = levelConfigurationReader.getGhostModeLengths();

        // Set up collectables
        this.collectables = new ArrayList<>(maze.getPellets());

        //Put levelImpl instances inside pellets
        for (Renderable powerPellet : maze.getPowerPellets()){
            ((PowerPellet) powerPellet).setLevelImplementation(this);
            ((PowerPellet) powerPellet).resetCollectableStatus();
        }
        
    }


    public void activateFrightenedModeForAllGhosts() {
        frightenedModeActive = true;
        frightenedModeTimer = 0; // Reset the timer
        consecutiveGhostsEaten = 0;
    
        // Set all ghosts to FRIGHTENED mode
        for (Ghost g : ghosts) {
            g.setGhostMode(GhostMode.FRIGHTENED);
        }
    }
    

    @Override
    public List<Renderable> getRenderables() {
        return this.renderables;
    }

    private List<DynamicEntity> getDynamicEntities() {
        return renderables.stream().filter(e -> e instanceof DynamicEntity).map(e -> (DynamicEntity) e).collect(
                Collectors.toList());
    }

    private List<StaticEntity> getStaticEntities() {
        return renderables.stream().filter(e -> e instanceof StaticEntity).map(e -> (StaticEntity) e).collect(
                Collectors.toList());
    }

    // Called when Pac-Man eats a ghost during FRIGHTENED mode
    public void ghostEaten(GhostImpl ghost) {
            // Determine points based on consecutive ghosts eaten
            int pointsEarned = FRIGHTENED_MODE_POINTS[Math.min(consecutiveGhostsEaten, FRIGHTENED_MODE_POINTS.length - 1)];
            consecutiveGhostsEaten++; // Increment for each ghost eaten in this FRIGHTENED period

            // Update score and notify observers
            points += pointsEarned;
            notifyObserversWithScoreChange(pointsEarned);

            //Start invulnerability timer
            isPacmanInvulnerable = true;
            pacmanInvulnerabilityTimer = PACMAN_BUFFER_DURATION;

            // Respawn the eaten ghost in SCATTER mode after a 1-second delay
            ghost.setImage(originalImages.get(ghost));
            ghost.exitFrightenedMode();
            ghost.setGhostMode(currentGhostMode);
            ghost.respawn();
            
    }


    @Override
    public void tick() {
        if (this.gameState != GameState.IN_PROGRESS) {

            if (tickCount >= START_LEVEL_TIME) {
                setGameState(GameState.IN_PROGRESS);
                tickCount = 0;
            }

        } else {
            // Handle frightened mode timing
            if (frightenedModeActive) {
                frightenedModeTimer++;
                // if timer >= frightened duration
                if (frightenedModeTimer >= modeLengths.get(GhostMode.FRIGHTENED)*60) {
                    //Exit ghost mode
                    for (Ghost g : ghosts){
                        g.exitFrightenedMode();
                        g.setImage(originalImages.get(g)); //reset ghost image to original

                    }
                    frightenedModeActive = false;
                }
            }

            // Handle Pac-Man's invulnerability buffer timing
            if (isPacmanInvulnerable) {
                pacmanInvulnerabilityTimer--;
                if (pacmanInvulnerabilityTimer <= 0) {
                    isPacmanInvulnerable = false;
                }
            }

            if (!frightenedModeActive && tickCount == modeLengths.get(currentGhostMode)) {
                // update ghost mode
                this.currentGhostMode = GhostMode.getNextGhostMode(currentGhostMode);
                Vector2D blinkyPosition = new Vector2D(0, 0);
                for (Ghost ghost : this.ghosts) {
                    if (ghost.getGhostStrategy() instanceof BlinkyStrategy){
                        blinkyPosition = ghost.getPosition();
                    }
                    ghost.setBlinkyPosition(blinkyPosition); //set each ghost to track blinky's position
                    ghost.setGhostMode(this.currentGhostMode); 
                }

                tickCount = 0;
            }

            if (tickCount % Pacman.PACMAN_IMAGE_SWAP_TICK_COUNT == 0) {
                this.player.switchImage();
            }

            // Update the dynamic entities
            List<DynamicEntity> dynamicEntities = getDynamicEntities();

            for (DynamicEntity dynamicEntity : dynamicEntities) {
                maze.updatePossibleDirections(dynamicEntity);
                dynamicEntity.update();
            }

            for (int i = 0; i < dynamicEntities.size(); ++i) {
                DynamicEntity dynamicEntityA = dynamicEntities.get(i);

                // handle collisions between dynamic entities
                for (int j = i + 1; j < dynamicEntities.size(); ++j) {
                    DynamicEntity dynamicEntityB = dynamicEntities.get(j);

                    if (dynamicEntityA.collidesWith(dynamicEntityB) ||
                            dynamicEntityB.collidesWith(dynamicEntityA)) {
                                dynamicEntityA.collideWith(this, dynamicEntityB);
                                dynamicEntityB.collideWith(this, dynamicEntityA);  
                               
                    }
                }
                // handle collisions between dynamic entities and static entities
                for (StaticEntity staticEntity : getStaticEntities()) {
                    if (dynamicEntityA.collidesWith(staticEntity)) {
                        dynamicEntityA.collideWith(this, staticEntity);
                        PhysicsEngine.resolveCollision(dynamicEntityA, staticEntity);
                    }
                }
            }
        }
        tickCount++;
    }

    public boolean isPacmanInvulnerable(){
        return this.isPacmanInvulnerable;
    }



    @Override
    public boolean isPlayer(Renderable renderable) {
        return renderable == this.player;
    }

    @Override
    public boolean isCollectable(Renderable renderable) {
        return maze.getPellets().contains(renderable) && ((Collectable) renderable).isCollectable();
    }

    @Override
    public void collect(Collectable collectable) {
        this.points += collectable.getPoints();
        notifyObserversWithScoreChange(collectable.getPoints());
        this.collectables.remove(collectable);
    }

    @Override
    public void handleLoseLife() {
        if (gameState == GameState.IN_PROGRESS) {
            for (DynamicEntity dynamicEntity : getDynamicEntities()) {
                dynamicEntity.reset();
            }
            setNumLives(numLives - 1);
            setGameState(GameState.READY);
            tickCount = 0;
        }
    }

    @Override
    public void moveLeft() {
        player.left();
    }

    @Override
    public void moveRight() {
        player.right();
    }

    @Override
    public void moveUp() {
        player.up();
    }

    @Override
    public void moveDown() {
        player.down();
    }

    @Override
    public boolean isLevelFinished() {
        if (collectables.isEmpty()){
            //Reset GHOSTS
            for (Ghost g: ghosts){
                g.exitFrightenedMode(); //exit frightened mode
                g.setImage(originalImages.get(g)); //reset image
            }
            //Reset Collectables
            this.collectables.clear();

        // Reassign LevelImpl reference to each power pellet
        for (Renderable powerPellet : maze.getPowerPellets()) {
            ((PowerPellet) powerPellet).setLevelImplementation(this);
            ((PowerPellet) powerPellet).reset();
        }
        }
        return collectables.isEmpty();
    }

    @Override
    public void registerObserver(LevelStateObserver observer) {
        this.observers.add(observer);
        observer.updateNumLives(this.numLives);
        observer.updateGameState(this.gameState);
    }

    @Override
    public void removeObserver(LevelStateObserver observer) {
        this.observers.remove(observer);
    }

    @Override
    public void notifyObserversWithNumLives() {
        for (LevelStateObserver observer : observers) {
            observer.updateNumLives(this.numLives);
        }
    }

    private void setGameState(GameState gameState) {
        this.gameState = gameState;
        notifyObserversWithGameState();
    }

    @Override
    public void notifyObserversWithGameState() {
        for (LevelStateObserver observer : observers) {
            observer.updateGameState(gameState);
        }
    }

    /**
     * Notifies observer of change in player's score
     */
    public void notifyObserversWithScoreChange(int scoreChange) {
        for (LevelStateObserver observer : observers) {
            observer.updateScore(scoreChange);
        }
    }

    @Override
    public int getPoints() {
        return this.points;
    }

    @Override
    public int getNumLives() {
        return this.numLives;
    }

    private void setNumLives(int numLives) {
        this.numLives = numLives;
        notifyObserversWithNumLives();
    }

    @Override
    public void handleGameEnd() {
        this.renderables.removeAll(getDynamicEntities());
    }
}

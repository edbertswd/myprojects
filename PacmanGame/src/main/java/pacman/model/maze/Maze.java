package pacman.model.maze;

import pacman.model.entity.Renderable;
import pacman.model.entity.dynamic.DynamicEntity;
import pacman.model.entity.dynamic.ghost.GhostImpl;
import pacman.model.entity.dynamic.physics.Direction;
import pacman.model.factories.RenderableType;

import java.util.*;


/**
 * Stores and manages the renderables for the Pac-Man game
 */
public class Maze {

    private static final int MAX_CENTER_DISTANCE = 4;
    private final List<Renderable> renderables;
    private final List<Renderable> ghosts;
    private final List<Renderable> pellets;
    private final Map<String, Boolean> isWall;
    private Renderable pacman;
    private int numLives;
    private List<Renderable> powerPellets;

    public Maze() {
        this.renderables = new ArrayList<>();
        this.ghosts = new ArrayList<>();
        this.pellets = new ArrayList<>();
        this.isWall = new HashMap<>();
        this.powerPellets = new ArrayList<>();
    }

    private static String formatCoordinates(int x, int y) {
        return String.format("(%d, %d)", x, y);
    }

    /**
     * Returns true if possible directions indicates entity is at an intersection (i.e. can turn in at least 2 adjacent directions)
     *
     * @param possibleDirections possible directions of entity
     * @return true, if entity is at intersection
     */
    public static boolean isAtIntersection(Set<Direction> possibleDirections) {
        // can turn
        if (possibleDirections.contains(Direction.LEFT) || possibleDirections.contains(Direction.RIGHT)) {
            return possibleDirections.contains(Direction.UP) ||
                    possibleDirections.contains(Direction.DOWN);
        }

        return false;
    }

    /**
     * Adds the renderable to maze
     *
     * @param renderable     renderable to be added
     * @param renderableType the renderable type
     * @param x              grid X position
     * @param y              grid Y position
     */
public void addRenderable(Renderable renderable, char renderableType, int x, int y) {
    if (renderable != null) {
        if (renderableType == RenderableType.PACMAN) {
            this.pacman = renderable;
        } else if (renderableType == RenderableType.BLINKY) {
            this.ghosts.add(renderable);
        } else if (renderableType == RenderableType.SPEEDY) {
            this.ghosts.add(renderable);
        } else if (renderableType == RenderableType.INKY) {
            this.ghosts.add(renderable);
        } else if (renderableType == RenderableType.CLYDE) {
            this.ghosts.add(renderable);
        } else if (renderableType == RenderableType.PELLET) {
            this.pellets.add(renderable);
        }  else if (renderableType == RenderableType.POWER_PELLET){
            this.pellets.add(renderable);
            this.powerPellets.add(renderable);
        }
        else {
            this.isWall.put(formatCoordinates(x, y), true);
        }
        //Set ghost position
        for (Renderable g : ghosts){
            ((GhostImpl) g).setGhostPosition(g.getPosition());
        }
        this.renderables.add(renderable);
    }
}


    public List<Renderable> getRenderables() {
        return renderables;
    }

    public List<Renderable> getPowerPellets(){
        return powerPellets;
    }

    public Renderable getControllable() {
        return pacman;
    }

    public List<Renderable> getGhosts() {
        return ghosts;
    }

    public List<Renderable> getPellets() {
        return pellets;
    }


    private int getCenterOfTile(int index) {
        return index * MazeCreator.RESIZING_FACTOR + MazeCreator.RESIZING_FACTOR / 2;
    }

    /**
     * Updates the possible directions of the dynamic entity based on the maze configuration
     */
    public void updatePossibleDirections(DynamicEntity dynamicEntity) {
        int xTile = (int) Math.floor(dynamicEntity.getCenter().getX() / MazeCreator.RESIZING_FACTOR);
        int yTile = (int) Math.floor(dynamicEntity.getCenter().getY() / MazeCreator.RESIZING_FACTOR);

        Set<Direction> possibleDirections = new HashSet<>();

        if (Math.abs(getCenterOfTile(xTile) - dynamicEntity.getCenter().getX()) < MAX_CENTER_DISTANCE &&
                Math.abs(getCenterOfTile(yTile) - dynamicEntity.getCenter().getY()) < MAX_CENTER_DISTANCE) {

            String aboveCoordinates = formatCoordinates(xTile, yTile - 1);
            if (isWall.get(aboveCoordinates) == null) {
                possibleDirections.add(Direction.UP);
            }

            String belowCoordinates = formatCoordinates(xTile, yTile + 1);
            if (isWall.get(belowCoordinates) == null) {
                possibleDirections.add(Direction.DOWN);
            }

            String leftCoordinates = formatCoordinates(xTile - 1, yTile);
            if (isWall.get(leftCoordinates) == null) {
                possibleDirections.add(Direction.LEFT);
            }

            String rightCoordinates = formatCoordinates(xTile + 1, yTile);
            if (isWall.get(rightCoordinates) == null) {
                possibleDirections.add(Direction.RIGHT);
            }
        } else {
            possibleDirections.add(dynamicEntity.getDirection());
            possibleDirections.add(dynamicEntity.getDirection().opposite());
        }

        dynamicEntity.setPossibleDirections(possibleDirections);
    }

    public int getNumLives() {
        return numLives;
    }

    public void setNumLives(int numLives) {
        this.numLives = numLives;
    }

    /**
     * Resets all renderables to starting state
     */
    public void reset() {
        for (Renderable renderable : renderables) {
            renderable.reset();
        }
    }
}

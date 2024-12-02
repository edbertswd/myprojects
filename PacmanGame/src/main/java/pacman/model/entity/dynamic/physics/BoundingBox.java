package pacman.model.entity.dynamic.physics;

/**
 * Simple bounding volume, represented by a box with no rotation.
 */
public interface BoundingBox {

    /**
     * @return The horizontal width of this volume, in pixels.
     */
    double getWidth();

    /**
     * @return double The vertical height of this volume, in pixels.
     */
    double getHeight();

    /**
     * @param collisionOffset The collision offset of the entity
     * @param box             The volume that is checked for overlap.
     * @return boolean This returns true if this box overlaps with the provided box, taking into account direction.
     */
    boolean collidesWith(double collisionOffset, Direction direction, BoundingBox box);

    /**
     * @param point 2D location to be queried.
     * @return boolean True if this volume contains the provided point.
     */
    boolean containsPoint(Vector2D point);

    /**
     * @return double The x coordinate of the left most wall of the box.
     */
    double getLeftX();

    /**
     * @return double The x coordinate of the right most wall of the box.
     */
    double getRightX();

    /**
     * @return double The y coordinate of the top of the box.
     */
    double getTopY();

    /**
     * @return double The y coordinate of the bottom of the box.
     */
    double getBottomY();

    /**
     * @param topLeft New top left anchor for the volume.
     *                The existing width and height is retained, with the boxes top left position
     *                now being anchored on the provided point.
     */
    void setTopLeft(Vector2D topLeft);


    /**
     * Gets the middle X position of the bounding box
     *
     * @return middle X position of bounding box
     */
    double getMiddleX();

    /**
     * Gets the middle Y position of the bounding box
     *
     * @return middle Y position of bounding box
     */
    double getMiddleY();
}


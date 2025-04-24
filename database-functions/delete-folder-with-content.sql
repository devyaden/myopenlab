CREATE OR REPLACE FUNCTION delete_folder_with_contents(folder_id_alias UUID)
RETURNS void AS $$
DECLARE
    canvas_id_var UUID;
    child_folder_id UUID;
BEGIN
    -- First, recursively delete child folders
    FOR child_folder_id IN (SELECT id FROM folder WHERE parent_id = folder_id_alias) LOOP
        PERFORM delete_folder_with_contents(child_folder_id);
    END LOOP;

    -- Iterate over each canvas in the current folder
    FOR canvas_id_var IN (SELECT id FROM canvas WHERE folder_id = folder_id_alias) LOOP
        -- Delete canvas dependencies in order
        DELETE FROM column_definition WHERE related_canvas_id = canvas_id_var;
        DELETE FROM column_definition WHERE canvas_id = canvas_id_var;
        DELETE FROM canvas_share WHERE canvas_id = canvas_id_var;
        DELETE FROM canvas_history WHERE canvas_id = canvas_id_var;
        DELETE FROM canvas_settings WHERE canvas_id = canvas_id_var;
        DELETE FROM canvas_data WHERE canvas_id = canvas_id_var;
        DELETE FROM document_data WHERE canvas_id = canvas_id_var;
    END LOOP;

    -- Delete canvases in this folder
    DELETE FROM canvas WHERE folder_id = folder_id_alias;

    -- Delete the folder itself
    DELETE FROM folder WHERE id = folder_id_alias;
END;
$$ LANGUAGE plpgsql;
